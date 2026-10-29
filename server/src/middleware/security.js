export function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

export function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

function generateRequestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}
