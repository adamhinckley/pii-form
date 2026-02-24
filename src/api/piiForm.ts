import type { ApiError, ApiSuccess, IdentityFormData, IdentityRecord } from './types';

const BASE_URL = '/api/v1';

export class ApiRequestError extends Error {
  public status: number;
  public error: ApiError;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.status = status;
    this.error = error;
    this.name = 'ApiRequestError';
  }
}

async function handleResponse<T>(res: Response): Promise<ApiSuccess<T>> {
  const body = await res.json();
  if (!res.ok) {
    throw new ApiRequestError(res.status, body as ApiError);
  }
  return body as ApiSuccess<T>;
}

export async function submitIdentityForm(
  data: IdentityFormData
): Promise<ApiSuccess<IdentityRecord>> {
  const res = await fetch(`${BASE_URL}/identity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<IdentityRecord>(res);
}

export async function getIdentityRecord(
  id: string
): Promise<ApiSuccess<IdentityRecord>> {
  const res = await fetch(`${BASE_URL}/identity/${id}`);
  return handleResponse<IdentityRecord>(res);
}

export async function healthCheck(): Promise<ApiSuccess<{ status: string }>> {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse<{ status: string }>(res);
}
