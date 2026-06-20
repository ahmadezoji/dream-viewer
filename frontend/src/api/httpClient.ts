import { API_BASE_URL } from '../config';

/** Error carrying the HTTP status and the backend's `{ error }` message. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Body = unknown;

async function request<T>(
  method: string,
  path: string,
  body?: Body,
  contentType?: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body !== undefined) {
    if (contentType === 'application/json') {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    } else if (contentType) {
      headers['Content-Type'] = contentType;
      payload = body as BodyInit;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string') message = data.error;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const http = {
  getJson: <T>(path: string) => request<T>('GET', path),
  postJson: <T>(path: string, body: Body) => request<T>('POST', path, body, 'application/json'),
  postText: <T>(path: string, text: string) => request<T>('POST', path, text, 'text/csv'),
  postBytes: <T>(path: string, bytes: ArrayBuffer | Uint8Array) =>
    request<T>('POST', path, bytes, 'application/octet-stream'),
};
