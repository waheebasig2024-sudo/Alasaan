export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Maybe<T> = T | null | undefined;

export interface Timestamped {
  createdAt: number;
  updatedAt: number;
}

export type Platform = "android" | "ios" | "web";

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}
