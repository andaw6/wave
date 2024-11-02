// middlewares/validate-request.ts

import { z } from 'zod';
import { BadRequestException } from '../exceptions';

export function validateRequest<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new BadRequestException('Validation failed', error.errors);
    }
    throw error;
  }
}