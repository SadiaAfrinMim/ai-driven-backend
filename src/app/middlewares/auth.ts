import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../../errors/ApiError';

const auth = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new ApiError(401, 'Access denied. No token provided.');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        email: string;
        role: string;
      };

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new ApiError(403, 'Access denied. Insufficient permissions.');
      }

      (req as any).user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;