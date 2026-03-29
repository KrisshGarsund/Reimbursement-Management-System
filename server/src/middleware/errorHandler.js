import { ApiError } from '../utils/apiError.js';

export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with that unique field already exists',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
