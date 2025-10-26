import { getCourseStreamStats } from '@/lib/queries';
import { createApiHandler } from '@/lib/apiHandler';

export const GET = createApiHandler(async () => {
  return getCourseStreamStats();
}, { logLabel: 'course-streams' });
