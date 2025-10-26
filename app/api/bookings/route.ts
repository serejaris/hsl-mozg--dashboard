import { getRecentBookings } from '@/lib/queries';
import { createApiHandler, httpError } from '@/lib/apiHandler';

export const GET = createApiHandler(async (request) => {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (Number.isNaN(limit) || limit <= 0 || limit > 200) {
    throw httpError(400, 'limit must be a positive integer <= 200');
  }

  return getRecentBookings(limit);
}, { logLabel: 'bookings' });
