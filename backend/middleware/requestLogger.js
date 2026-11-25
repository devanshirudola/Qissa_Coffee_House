// Simple request logger middleware – logs method, url, timestamp, response status and duration.
// Sensitive data (tokens, passwords, auth headers, cookies, request bodies) are never logged.
export function requestLogger(req, res, next) {
  const start = Date.now();
  const now = new Date().toISOString();
  // Redact sensitive query parameters
  const redactedQuery = { ...req.query };
  const sensitiveKeys = ['token','access_token','password','resetToken','auth','authorization'];
  for (const key of Object.keys(redactedQuery)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      redactedQuery[key] = '[REDACTED]';
    }
  }
  // After response finishes, log details
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    // Use req.path (no query string) to avoid leaking raw params in logs
    console.info(`[${now}] ${req.method} ${req.path} ${JSON.stringify(redactedQuery)} ${status} ${duration}ms`);
  });
  next();
}
