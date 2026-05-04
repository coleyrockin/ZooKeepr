const crypto = require('crypto');

const WRITE_WINDOW_MS = 60 * 1000;
const writeHits = new Map();

function getWriteLimit() {
  const configuredLimit = Number(process.env.ZOO_WRITE_RATE_LIMIT);
  if (Number.isInteger(configuredLimit) && configuredLimit > 0) {
    return configuredLimit;
  }
  return 30;
}

function getClientIp(req) {
  return (
    req.ip || (req.connection && req.connection.remoteAddress) || (req.socket && req.socket.remoteAddress) || 'unknown'
  );
}

function rateLimitWrites(req, res, next) {
  if (req.method !== 'POST') {
    return next();
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = writeHits.get(ip) || { start: now, count: 0 };
  const writeLimit = getWriteLimit();

  if (now - bucket.start >= WRITE_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }

  bucket.count += 1;
  writeHits.set(ip, bucket);

  if (bucket.count > writeLimit) {
    return res.status(429).json({
      error: 'Too many write requests. Please wait a minute and try again.'
    });
  }

  return next();
}

function requireWriteAuth(req, res, next) {
  if (req.method !== 'POST') {
    return next();
  }

  if (process.env.ZOO_WRITES_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Write API is currently disabled.' });
  }

  const configuredToken = process.env.ZOO_WRITE_TOKEN;
  if (!configuredToken) {
    return res.status(401).json({ error: 'Write token is not configured for this deployment.' });
  }

  const suppliedToken = req.get('x-zoo-write-token');
  if (!suppliedToken || suppliedToken.length !== configuredToken.length) {
    return res.status(401).json({ error: 'Missing or invalid write token.' });
  }

  const safeMatch = crypto.timingSafeEqual(
    Buffer.from(suppliedToken),
    Buffer.from(configuredToken)
  );
  if (!safeMatch) {
    return res.status(401).json({ error: 'Missing or invalid write token.' });
  }

  return next();
}

module.exports = { rateLimitWrites, requireWriteAuth };
