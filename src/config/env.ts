import { z } from 'zod';

const envSchema = z.object({
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_NAME: z.string().default('ScheduleManagement'),
  VITE_API_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.data ?? envSchema.parse({});
