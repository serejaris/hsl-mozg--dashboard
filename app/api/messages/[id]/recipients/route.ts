import { getMessageRecipients } from '@/lib/queries';
import { createApiHandler, httpError } from '@/lib/apiHandler';

export const GET = createApiHandler(async (_request, context) => {
  const params = (context?.params ?? {}) as { id?: string };
  const messageId = params?.id ? parseInt(params.id, 10) : NaN;

  if (Number.isNaN(messageId) || messageId <= 0) {
    throw httpError(400, 'Invalid message ID');
  }

  return getMessageRecipients(messageId);
}, { logLabel: 'message-recipients' });
