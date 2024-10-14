import { z } from 'zod';

export const uuidSchema = z.object({ id: z.string() });
export const numericIdSchema = z.object({ id: z.number() });
