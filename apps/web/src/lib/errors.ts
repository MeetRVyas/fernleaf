import { notifications } from '@mantine/notifications';

type ApiError = { code?: string; message?: string; details?: Record<string, string> };

export function readApiError(error: unknown): ApiError {
  if (typeof error !== 'object' || error === null) return { message: 'Something went wrong.' };
  const value = error as Record<string, unknown>;
  return {
    code: typeof value.code === 'string' ? value.code : undefined,
    message: typeof value.message === 'string' ? value.message : 'Something went wrong.',
    details: isDetails(value.details) ? value.details : undefined,
  };
}

function isDetails(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.values(value).every(item => typeof item === 'string');
}

export function showApiError(error: unknown, setFieldError?: (field: string, message: string) => void): void {
  const parsed = readApiError(error);
  if (parsed.details && Object.keys(parsed.details).length > 0 && setFieldError) {
    for (const [field, message] of Object.entries(parsed.details)) setFieldError(field, message);
    return;
  }
  notifications.show({ color: 'red', title: 'Request failed', message: parsed.message });
}
