import { validationResult } from 'express-validator';

/**
 * Middleware to format validation results.
 * Returns HTTP 400 with an array of error messages when validation fails.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Extract only messages for a clean response.
    const msgs = errors.array().map((e) => e.msg);
    return res.status(400).json({ success: false, errors: msgs });
  }
  next();
}
