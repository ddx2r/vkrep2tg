// src/security/rateLimit.js — простой fixed-window rate limiter без внешних зависимостей.
// Достаточно для одного вебхук-эндпоинта: не пускать наивный флуд до дорогой обработки
// (парсинг тела, сравнение секрета, дедуп), не претендуя на защиту от распределённого DDoS.

function createRateLimiter({ windowMs = 60_000, max = 120 } = {}) {
  const hits = new Map(); // key -> { count, resetAt }

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return function rateLimit(req, res, next) {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).send('Too Many Requests');
    }

    next();
  };
}

module.exports = { createRateLimiter };
