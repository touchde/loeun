# Download Engine Design

This document covers the internals of `loeun-core`: how a download is probed, split, executed, saved and resumed.

## 1. Task Lifecycle

```
            add()
              │
              ▼
          ┌────────┐  probe ok   ┌────────┐  slot free  ┌─────────────┐
          │ Probing├────────────►│ Queued ├────────────►│ Downloading │
          └───┬────┘             └───┬────┘             └──┬───┬───┬──┘
              │ fatal                │ pause               │   │   │
              ▼                      ▼                     │   │   │ all segments done
          ┌────────┐             ┌────────┐   pause        │   │   ▼
          │ Failed │◄────────────┤ Paused │◄───────────────┘   │ ┌────────────┐
          └────────┘   fatal     └───┬────┘                    │ │ Verifying  │
              ▲                      │ resume (→ revalidate)   │ └─────┬──────┘
              │                      └────────► Queued         │       ▼
              │                                                │ ┌───────────┐
              └──────────────── retries exhausted ─────────────┘ │ Completed │
                                                                 └───────────┘
```

States are saved on every transition. On startup, tasks found in `Downloading`, `Probing` or `Verifying` are moved to `Paused` (resumable).

## 2. Probing

1. Send `GET` with `Range: bytes=0-0`. Some servers handle `HEAD` badly, so we don't rely on it.
2. Follow redirects (max 10). Keep the **final URL** and the **original URL** for refreshing.
3. Read the response:
   - `206 Partial Content` + `Content-Range: bytes 0-0/N` → **resumable**, size = N.
   - `200 OK` + `Content-Length: N` → size known, **not resumable**, single connection.
   - No length (chunked) → size unknown, single connection, streaming.
   - `Accept-Ranges: none` → not resumable.
4. Save validators: `ETag`, `Last-Modified`, `Content-Length`, `Content-Type`.
5. Pick the filename in this order: user-provided name → `Content-Disposition` (RFC 6266, `filename*` preferred) → final URL path → `download`. Add an extension from the MIME type if missing, then sanitize.
6. Reuse the probe connection as the first segment's connection when possible (HTTP/1.1 keep-alive; HTTP/2 multiplexing).

## 3. Segment Planning

- Initial plan: split `[0, N)` into `C` equal segments (C = configured connections), each at least `min_segment_size` (default 1 MiB). Small files use fewer connections.
- Each segment is `{id, start, end (exclusive), downloaded}`; the current position is `start + downloaded`.

## 4. Dynamic Splitting (work stealing)

When a worker finishes its segment and the task still has remaining bytes:

```
victim = segment with max remaining bytes (remaining = end - (start + downloaded))
if victim.remaining >= 2 * min_segment_size:
    mid = victim.cursor + victim.remaining / 2   (aligned to 64 KiB)
    new_segment = [mid, victim.end)
    victim.end = mid           ← atomic update; victim worker stops at new end
    spawn worker for new_segment
else:
    worker exits (connection released)
```

- `victim.end` is an `AtomicU64`. The victim worker checks it after every chunk and stops (or trims its last chunk) when it reaches it.
- Because the victim has already requested `Range: start-oldEnd`, it just **stops reading early** and drops the connection. HTTP/2 lets us cancel the stream cheaply.
- This keeps all C connections busy until the very end, which removes the slow-tail problem of naive equal splitting.

## 5. Adaptive Connections (ENG-04, P1)

Every 2 s the task controller compares throughput:

- If adding a connection in the last window raised throughput by ≥ 10%, add another (up to `max_connections`).
- If throughput is flat or dropping and the server returned `429` / `503`, or connections are being reset, remove one and lower the per-domain cap.
- Track per-host caps across tasks (`HostLimiter`) so 5 downloads from the same host don't open 80 connections.

## 6. I/O & Durability

### Writing
- Preallocate the file at size N (`fallocate` / `F_PREALLOCATE` / `set_len`) in `<name>.loeun-part`.
- Each worker streams chunks (64–256 KiB) into a per-task **writer** through a bounded channel of `(offset, Bytes)`.
- The writer does positional writes (`pwrite` / `seek_write`). No temporary segment files and no merge step.
- On completion: `fsync`, then atomically rename to the final name, then delete the state rows.

### Checkpointing
- Every **2 s or 8 MiB** per task (whichever comes first), the writer `fdatasync`s the data file and only **then** commits the segment `downloaded` offsets to SQLite in one transaction.
- Invariant: **saved offset ≤ bytes durably on disk.** After a crash, we may re-download up to one checkpoint interval, but we never trust bytes that weren't written.

### Resume validation
On resume, re-probe and compare validators:

| Check | Mismatch action |
|---|---|
| `ETag` (strong) | Restart from 0 (ask user unless setting = auto) |
| `Last-Modified` | Same as above |
| `Content-Length` | Restart from 0 |
| Response is 200 to a range request | Server dropped range support → restart single-connection |
| 403/410 | Mark *Link expired* → prompt "Refresh address" (ENG-15) |

Ranged requests also send `If-Range: <etag>` so the server returns the full content (200) instead of mixing two versions.

## 7. Persistence Schema

```sql
CREATE TABLE tasks (
  id              TEXT PRIMARY KEY,          -- UUIDv7
  url             TEXT NOT NULL,             -- original URL
  final_url       TEXT,
  file_name       TEXT NOT NULL,
  dest_dir        TEXT NOT NULL,
  category        TEXT,
  queue_id        TEXT REFERENCES queues(id),
  state           TEXT NOT NULL,             -- probing|queued|downloading|paused|verifying|completed|failed
  error           TEXT,
  total_size      INTEGER,                   -- NULL = unknown
  downloaded      INTEGER NOT NULL DEFAULT 0,
  resumable       INTEGER NOT NULL DEFAULT 0,
  etag            TEXT,
  last_modified   TEXT,
  mime            TEXT,
  connections     INTEGER NOT NULL DEFAULT 8,
  speed_limit     INTEGER,                   -- bytes/s, NULL = unlimited
  headers_json    TEXT,                      -- referer, UA, cookies (cookies optional/encrypted)
  checksum_algo   TEXT,
  checksum_value  TEXT,
  priority        INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  completed_at    INTEGER
);

CREATE TABLE segments (
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  idx         INTEGER NOT NULL,
  start       INTEGER NOT NULL,
  end         INTEGER NOT NULL,              -- exclusive
  downloaded  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (task_id, idx)
);

CREATE TABLE queues (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  max_concurrent   INTEGER NOT NULL DEFAULT 3,
  schedule_json    TEXT
);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

## 8. Error Handling & Retries

| Class | Examples | Behavior |
|---|---|---|
| Transient network | timeout, reset, DNS fail, 5xx, 429 | Retry segment with exponential backoff (1s → 2s → 4s … max 60s, ±20% jitter), honor `Retry-After` |
| Link expired | 401/403/410 after a successful start | Pause task, flag `needs_refresh` |
| Fatal | 404 on probe, disk full, permission denied, validator mismatch (policy=fail) | Fail task with a readable message |
| Local | disk full | Pause **all** tasks on that volume, notify |

Retries happen **per segment**, so one bad connection doesn't stop the task. The task fails only when all segments have used up their retries.

## 9. Rate Limiting

Hierarchical token bucket: `Global → Queue → Task`. Workers `acquire(n)` before writing each chunk. Buckets refill every 50 ms, which keeps throughput smooth even at low limits. Limits can change at runtime without restarting tasks.

## 10. Progress & Speed Reporting

- Workers update per-segment `AtomicU64` counters (no locking on the hot path).
- The task controller samples every 250 ms. Speed is an EWMA over about 3 s, and ETA = remaining / EWMA.
- Event to the UI: `TaskProgress { id, downloaded, total, speed, eta, segments: [(start,end,downloaded)] }`, throttled to 4 Hz per task.

## 11. Testing Strategy (engine)

- **Unit:** segment planner, splitter, filename resolver, header parsing, rate limiter (property tests via `proptest`).
- **Integration:** in-process test HTTP server (`axum`) with configurable faults: no-range, slow segments, connection resets, changing ETag, 429 with `Retry-After`, redirects, chunked.
- **Crash fuzz:** spawn the CLI, `SIGKILL` at random times, resume, and compare the SHA-256 with the source. Runs on every PR (short) and nightly (long).
- **Benchmarks:** `criterion` micro-benchmarks + a throughput harness against a local server and a few public mirrors (nightly, results published).
