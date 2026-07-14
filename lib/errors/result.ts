import type { ErrorCode } from "./codes";

export type SuccessResult<T = undefined> = T extends undefined
  ? { success: true }
  : { success: true; data: T };

export type ErrorResult = { success: false; error: ErrorCode; errorMessage?: string };

export type ActionResult<T = undefined> = SuccessResult<T> | ErrorResult;

export function err(code: ErrorCode, message?: string): ErrorResult {
  return { success: false, error: code, errorMessage: message };
}

export function ok<T = undefined>(data?: T): SuccessResult<T> {
  return (data === undefined ? { success: true } : { success: true, data }) as SuccessResult<T>;
}
