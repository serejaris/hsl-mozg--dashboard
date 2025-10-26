import { getFreeLessonRegistrations } from '@/lib/queries';
import { createApiHandler, httpError } from '@/lib/apiHandler';

export const GET = createApiHandler(async (request) => {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : 50;

  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
    throw httpError(400, 'limit must be between 1 and 500');
  }

  return getFreeLessonRegistrations(parsedLimit);
}, { logLabel: 'free-lessons' });
