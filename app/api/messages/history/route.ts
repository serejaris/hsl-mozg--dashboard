import { getMessageHistory } from '@/lib/queries';
import { createApiHandler, httpError } from '@/lib/apiHandler';

const validRecipientTypes = new Set(['individual', 'group']);
const validStreams = new Set(['3rd_stream', '4th_stream', '5th_stream']);

export const GET = createApiHandler(async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const recipientType = searchParams.get('recipient_type') as 'individual' | 'group' | null;
  const recipientGroup = searchParams.get('recipient_group');

  if (Number.isNaN(limit) || limit < 1 || limit > 100) {
    throw httpError(400, 'Limit must be between 1 and 100');
  }

  if (Number.isNaN(offset) || offset < 0) {
    throw httpError(400, 'Offset must be non-negative');
  }

  if (recipientType && !validRecipientTypes.has(recipientType)) {
    throw httpError(400, 'recipient_type must be either "individual" or "group"');
  }

  if (recipientGroup && !validStreams.has(recipientGroup)) {
    throw httpError(
      400,
      `recipient_group must be one of: ${Array.from(validStreams).join(', ')}`
    );
  }

  console.log('📊 Message history API call:', {
    limit,
    offset,
    recipientType,
    recipientGroup,
    timestamp: new Date().toISOString()
  });

  const messages = await getMessageHistory(
    limit,
    offset,
    recipientType || undefined,
    recipientGroup || undefined
  );

  console.log('✅ Message history fetched:', {
    count: messages.length,
    hasFilters: !!(recipientType || recipientGroup),
    timestamp: new Date().toISOString()
  });

  return messages;
}, { logLabel: 'messages-history' });
