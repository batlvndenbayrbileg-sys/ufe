/**
 * The infinite-loop decision, extracted from PreviewHost so it can be reasoned
 * about and unit-tested on its own.
 *
 * A student's runaway loop blocks the preview iframe but not the host app — they
 * are separate JS contexts. Throttling (a hidden, occluded, or unpainted tab,
 * or the machine asleep) slows BOTH. So the host watchdog's own tick drifting
 * late is the tell that the whole context was paused, not that the iframe is
 * looping: in that case we must NOT flag a loop.
 */
export function isBlockedLoop(opts: {
  /** The iframe has reported "ready" (a page is live to time out). */
  ready: boolean;
  /** The host document is visible. */
  visible: boolean;
  /** How late this watchdog tick arrived versus its own interval, in ms. */
  tickDriftMs: number;
  /** How long since the iframe's last heartbeat, in ms. */
  sinceHeartbeatMs: number;
  /** The no-heartbeat threshold, in ms. */
  timeoutMs: number;
}): boolean {
  const { ready, visible, tickDriftMs, sinceHeartbeatMs, timeoutMs } = opts;
  if (!ready || !visible) return false;
  // Our own clock was suspended/throttled → the iframe was too. Not a loop.
  if (tickDriftMs > timeoutMs) return false;
  return sinceHeartbeatMs > timeoutMs;
}
