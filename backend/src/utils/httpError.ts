export class HttpError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly headers?: Record<string, string>;
  readonly extra?: Record<string, unknown>;

  constructor(
    status: number,
    detail: string,
    options: { headers?: Record<string, string>; extra?: Record<string, unknown> } = {},
  ) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.headers = options.headers;
    this.extra = options.extra;
  }
}

export const badRequest = (detail: string) => new HttpError(400, detail);
export const notFound = (detail: string) => new HttpError(404, detail);
export const conflict = (detail: string) => new HttpError(409, detail);
export const unauthorized = (detail: string) =>
  new HttpError(401, detail, { headers: { "WWW-Authenticate": "Bearer" } });
