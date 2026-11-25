// Centralized error handling middleware
// Sends consistent JSON error responses and hides sensitive details in production.
export function errorHandler(err, req, res, _next) {
  // Default to 500 internal server error
  const status = err.status || 500;
  // Determine if we should expose the original message (only for dev-like envs)
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const response = {
    success: false,
    // In production hide internal messages; otherwise expose err.message
    message: isDev ? err.message : (err.status ? err.message : 'Internal server error'),
  };
  // Optionally include validation errors if present (express‑validator)
  if (err.errors) {
    response.errors = err.errors;
  }
  // Do NOT include stack trace or internal details in production.
  res.status(status).json(response);
}
