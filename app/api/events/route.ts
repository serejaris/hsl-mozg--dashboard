import { getTopEvents, getDailyStats, getRecentEvents } from '@/lib/queries';
import { createApiHandler, httpError } from '@/lib/apiHandler';

export const GET = createApiHandler(async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const daysParam = searchParams.get('days');
  const limitParam = searchParams.get('limit');

  if (type === 'daily') {
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    if (Number.isNaN(days) || days < 1 || days > 365) {
      throw httpError(400, 'days must be between 1 and 365');
    }
    return getDailyStats(days);
  }

  if (type === 'recent') {
    const limit = limitParam ? parseInt(limitParam, 10) : 30;
    if (Number.isNaN(limit) || limit < 1 || limit > 200) {
      throw httpError(400, 'limit must be between 1 and 200');
    }
    return getRecentEvents(limit);
  }

  return getTopEvents(10);
}, { logLabel: 'events' });
