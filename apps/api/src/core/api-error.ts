import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@fernleaf/shared';
export class ApiError extends HttpException {
  constructor(public readonly code: ErrorCode, message: string, status: number, public readonly details?: Record<string, string>) { super(message, status); }
}
