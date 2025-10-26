import { getDashboardStats } from '@/lib/queries';
import '@/lib/init'; // Initialize application services
import { createApiHandler } from '@/lib/apiHandler';

export const GET = createApiHandler(async () => {
  return getDashboardStats();
}, { logLabel: 'stats' });
