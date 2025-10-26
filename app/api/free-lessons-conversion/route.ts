import { getLessonConversion } from '@/lib/queries';
import { createApiHandler } from '@/lib/apiHandler';

export const GET = createApiHandler(async () => {
  return getLessonConversion();
}, { logLabel: 'free-lessons-conversion' });
