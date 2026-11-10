import type { Context } from 'hono';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  error_code: string;
  message: string;
}

export function successResponse<T>(c: Context, data: T, message: string, status: 200 | 201 = 200) {
  return c.json<SuccessResponse<T>>(
    {
      success: true,
      message,
      data,
    },
    status
  );
}

export function errorResponse(
  c: Context,
  errorCode: string,
  message: string,
  status: 400 | 401 | 402 | 403 | 404 | 409 | 422 | 429 | 500 = 400
) {
  return c.json<ErrorResponse>(
    {
      success: false,
      error_code: errorCode,
      message,
    },
    status
  );
}
