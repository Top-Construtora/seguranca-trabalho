import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const validationMiddleware = (dtoClass: any, skipMissingProperties = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(dtoClass, req.body);
      const errors = await validate(dto, { skipMissingProperties });

      if (errors.length > 0) {
        const errorMessages = errors.map(error => ({
          property: error.property,
          constraints: error.constraints
        }));
        
        return res.status(400).json({
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      req.body = dto;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Validation error' });
    }
  };
};