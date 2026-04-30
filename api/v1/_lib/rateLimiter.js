/**
 * Rate limiter in-memory por API key.
 * Sliding window de 1 minuto.
 */
const windows = new Map();

function checkRateLimit(keyId, limitPerMin) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const cutoff = now - windowMs;

  if (!windows.has(keyId)) windows.set(keyId, []);

  const timestamps = windows.get(keyId).filter(ts => ts > cutoff);
  timestamps.push(now);
  windows.set(keyId, timestamps);

  const remaining = Math.max(0, limitPerMin - timestamps.length);
  const resetAt = Math.ceil((cutoff + windowMs) / 1000);

  return {
    allowed: timestamps.length <= limitPerMin,
    remaining,
    resetAt,
    limit: limitPerMin,
  };
}

module.exports = { checkRateLimit };
