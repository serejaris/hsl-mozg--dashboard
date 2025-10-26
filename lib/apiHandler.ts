import { NextRequest, NextResponse } from 'next/server';

type Handler<T = unknown> = (request: NextRequest, context?: Record<string, unknown>) => Promise<T>;

export class HttpError extends Error {
  status: number;
  payload?: Record<string, unknown>;

  constructor(status: number, message: string, payload?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

interface CreateApiHandlerOptions {
  logLabel?: string;
  successStatus?: number;
}

export function createApiHandler<T = unknown>(
  handler: Handler<T>,
  { logLabel, successStatus = 200 }: CreateApiHandlerOptions = {}
) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    try {
      const data = await handler(request, context);
      return NextResponse.json(data, { status: successStatus });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message =
        error instanceof HttpError ? error.message : 'Internal server error';
      const payload = error instanceof HttpError ? error.payload : undefined;

      const label = logLabel ? `[${logLabel}]` : '';
      console.error(`${label} API handler error:`, error);

      return NextResponse.json(
        {
          error: message,
          ...(payload || {})
        },
        { status }
      );
    }
  };
}

export function httpError(status: number, message: string, payload?: Record<string, unknown>) {
  return new HttpError(status, message, payload);
}
