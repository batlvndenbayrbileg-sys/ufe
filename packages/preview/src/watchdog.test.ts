import { describe, expect, it } from "vitest";
import { isBlockedLoop } from "./watchdog";

const TIMEOUT = 3000;
const base = { ready: true, visible: true, tickDriftMs: 0, sinceHeartbeatMs: 0, timeoutMs: TIMEOUT };

describe("isBlockedLoop", () => {
  it("flags a real loop: on-time ticks but the heartbeat stopped", () => {
    expect(isBlockedLoop({ ...base, tickDriftMs: 40, sinceHeartbeatMs: 3500 })).toBe(true);
  });

  it("does NOT flag throttling: our own tick arrived just as late as the gap", () => {
    // A tab that resumes after a minute: both the tick and the heartbeat are ~60s stale.
    expect(isBlockedLoop({ ...base, tickDriftMs: 59_000, sinceHeartbeatMs: 60_000 })).toBe(false);
  });

  it("does not flag while the heartbeat is still fresh", () => {
    expect(isBlockedLoop({ ...base, tickDriftMs: 30, sinceHeartbeatMs: 1200 })).toBe(false);
  });

  it("does not flag when the document is hidden", () => {
    expect(isBlockedLoop({ ...base, visible: false, sinceHeartbeatMs: 9000 })).toBe(false);
  });

  it("does not flag before a page is ready", () => {
    expect(isBlockedLoop({ ...base, ready: false, sinceHeartbeatMs: 9000 })).toBe(false);
  });

  it("treats a tick drift over the timeout as a suspend, not a loop", () => {
    // Exactly the embedded/automation case: 'visible' yet timers were throttled.
    expect(isBlockedLoop({ ...base, tickDriftMs: 3200, sinceHeartbeatMs: 5000 })).toBe(false);
  });
});
