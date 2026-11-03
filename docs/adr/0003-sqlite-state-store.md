# ADR-0003: SQLite for persistent state

- **Status:** Accepted
- **Date:** 2026-11-03

## Context
We need crash-safe storage for tasks, segment offsets, queues, settings and history. It will see frequent small updates (checkpoints every ~2 s per active task) and needs simple queries (filtering and sorting the list).

## Options
1. **SQLite (rusqlite, WAL):** atomic transactions, battle-tested durability, easy to inspect, single file.
2. **JSON files per task (aria2 style):** simple, but atomic rewrites are tricky, queries are awkward, and there's a corruption risk on crash.
3. **Embedded KV (redb, sled):** fast, but less tooling and no ad-hoc queries.

## Decision
**SQLite** with bundled `rusqlite`, WAL mode, `synchronous=NORMAL`, and schema migrations embedded in the binary.

## Consequences

**Positive**
- Transactions give the "offset ≤ durable bytes" invariant cheaply (see ENGINE_DESIGN §6).
- Users and developers can inspect the database with any SQLite tool.

**Negative**
- `rusqlite` is synchronous. DB access runs on a dedicated blocking thread behind an async handle.
