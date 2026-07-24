export interface ApiResponse<T = unknown> {
  result: boolean;
  data?: T;
  err?: string;
  message?: string;
  [key: string]: any;
}
