export class ApiError extends Error {
  status: number;
  statusText: string;
  body: unknown;
  url?: string;
  runId?: string;
  prefix?: string;
  original?: unknown;

  constructor(message: string, opts: {
    status: number;
    statusText?: string;
    body?: unknown;
    url?: string;
    runId?: string;
    prefix?: string;
    original?: unknown;
  }) {
    super(message, opts.original ? { cause: opts.original } : undefined);
    this.name = "ApiError";
    this.status = opts.status;
    this.statusText = opts.statusText ?? "";
    this.body = opts.body;
    this.url = opts.url;
    this.runId = opts.runId;
    this.prefix = opts.prefix;
    this.original = opts.original;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export async function checkResponse<T = unknown>(
  res: Response,
  ctx: { url?: string; runId?: string; prefix?: string } = {},
): Promise<T> {
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : text;
  } catch {
    body = text;
  }

  if (res.ok) return body as T;
  const message = `${ctx.prefix ?? "API"} request failed: ${res.status} ${res.statusText}`;
  throw new ApiError(message, {
    status: res.status,
    statusText: res.statusText,
    body,
    url: ctx.url,
    runId: ctx.runId,
    prefix: ctx.prefix,
  });
}