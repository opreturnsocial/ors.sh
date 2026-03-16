const WRITE_INTERVAL_MS = 10_000;
let lastWriteTimestamp = 0;

export function checkWriteRateLimit() {
  const now = Date.now();
  const elapsed = now - lastWriteTimestamp;
  if (lastWriteTimestamp > 0 && elapsed < WRITE_INTERVAL_MS) {
    return { allowed: false, retryAfterMs: WRITE_INTERVAL_MS - elapsed };
  }
  lastWriteTimestamp = now;
  return { allowed: true };
}
