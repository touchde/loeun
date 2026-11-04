import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

describe("App", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("shows the engine version reported by the Rust side", async () => {
    invoke.mockResolvedValue("1.2.3");
    render(<App />);

    expect(await screen.findByText("Engine v1.2.3")).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("engine_version");
  });

  it("shows an error when the engine cannot be reached", async () => {
    invoke.mockRejectedValue("not running in Tauri");
    render(<App />);

    expect(await screen.findByText(/Engine unavailable: not running in Tauri/)).toBeInTheDocument();
  });
});
