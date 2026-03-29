import { ApiError } from '../utils/apiError.js';

export function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to access this resource');
    }
    next();
  };
}
