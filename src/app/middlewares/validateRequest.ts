import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import ApiError from '../../errors/ApiError';

const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔍 Validating request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Request headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'None'
      });

      // First try parsing directly
      let result = schema.safeParse(req.body);

      // If that fails, try wrapping body (some schemas expect { body: {...} })
      if (!result.success) {
        result = schema.safeParse({ body: req.body });
      }

      if (!result.success) {
        console.log('🔍 Zod validation error:', result.error);
        console.log('🔍 Zod issues details:', JSON.stringify(result.error.issues, null, 2));

        const issues = result.error.issues.map((err: any) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
        }));

        return next(new ApiError(400, 'Validation failed', issues));
      }

      console.log('✅ Request validation passed');
      // Validation passed
      next();
    
    } catch (error: any) {
      console.error('❌ Validation middleware error:', error);
      next(new ApiError(500, 'Validation processing failed'));
    }
  };
};

const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        console.log('🔍 Zod query validation error:', result.error);

        const issues = result.error.issues.map((err: any) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
        }));

        return next(new ApiError(400, 'Query validation failed', issues));
      }

      // Validation passed
      next();
    } catch (error: any) {
      console.error('❌ Query validation middleware error:', error);
      next(new ApiError(500, 'Query validation processing failed'));
    }
  };
};

export { validateQuery };
export default validateRequest;