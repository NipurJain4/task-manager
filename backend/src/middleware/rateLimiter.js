const rateLimit = {};

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a proper rate limiting service
 */
const rateLimiter = (req, res, next) => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Initialize client record if it doesn't exist
  if (!rateLimit[clientId]) {
    rateLimit[clientId] = [];
  }

  // Remove old requests outside the window
  rateLimit[clientId] = rateLimit[clientId].filter(timestamp => timestamp > windowStart);

  // Check if client has exceeded the limit
  if (rateLimit[clientId].length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }

  // Add current request timestamp
  rateLimit[clientId].push(now);

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': maxRequests,
    'X-RateLimit-Remaining': Math.max(0, maxRequests - rateLimit[clientId].length),
    'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
  });

  next();
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  
  Object.keys(rateLimit).forEach(clientId => {
    rateLimit[clientId] = rateLimit[clientId].filter(timestamp => timestamp > now - windowMs);
    
    // Remove empty client records
    if (rateLimit[clientId].length === 0) {
      delete rateLimit[clientId];
    }
  });
}, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = rateLimiter;
