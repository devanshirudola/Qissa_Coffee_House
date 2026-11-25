import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to require authentication via JWT.
 * Always enforces authentication, even in test mode.
 * For unit tests, mock this middleware or invoke route handlers directly.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Authentication is not configured.' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Your account could not be found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
}

/**
 * Middleware to ensure the authenticated user has admin role.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You do not have access to reservation management.' });
  }
  next();
}
