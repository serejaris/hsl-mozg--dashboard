import { getUserGrowthData } from '@/lib/queries';
import { createApiHandler, httpError } from '@/lib/apiHandler';

export const GET = createApiHandler(async (request) => {
  const daysParam = request.nextUrl.searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;

  if (Number.isNaN(days) || days < 1 || days > 365) {
    throw httpError(400, 'days must be between 1 and 365');
  }

  return getUserGrowthData(days);
}, { logLabel: 'user-growth' });
