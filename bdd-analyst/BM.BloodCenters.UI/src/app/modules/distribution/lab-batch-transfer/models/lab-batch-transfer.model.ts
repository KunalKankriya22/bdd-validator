export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T | null;
}

export interface BatchTransferResult {
  processStartTime: string;
  processEndTime: string;
}
