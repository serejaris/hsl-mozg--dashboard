import { NextRequest, NextResponse } from 'next/server';

type RouteParams = Record<string, string | string[] | undefined>;

export type ApiRouteContext<Params extends RouteParams = RouteParams> = {
  params: Promise<Params>;
};

type Handler<T = unknown, Params extends RouteParams = RouteParams> = (
  request: NextRequest,
  context?: ApiRouteContext<Params>
) => Promise<T>;

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

export function createApiHandler<T = unknown, Params extends RouteParams = RouteParams>(
  handler: Handler<T, Params>,
  { logLabel, successStatus = 200 }: CreateApiHandlerOptions = {}
) {
  return async (request: NextRequest, context: ApiRouteContext<Params>) => {
    try {
      const runtimeContext =
        context ??
        ({
          params: Promise.resolve({} as Params)
        } as ApiRouteContext<Params>);
      const data = await handler(request, runtimeContext);
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
