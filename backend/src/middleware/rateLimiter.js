const rateLimit = require('express-rate-limit');

// Global API Limiter: Prevents general abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Auth Limiter: Prevents brute force on login/register
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/register attempts per hour
  message: {
    message: 'Too many authentication attempts, please try again after an hour',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

  // Complaint Submission Limiter: Prevents report spam
const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user/IP to 5 complaints per hour
  message: {
    message: 'Report limit reached. You can only submit 5 reports per hour to prevent spam.',
    code: 'SPAM_PREVENTION_LIMIT'
  },
  // Use user ID if authenticated, else use IP
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  validate: { 
    xForwardedForHeader: false,
    keyGeneratorIpFallback: false 
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  complaintLimiter
};
