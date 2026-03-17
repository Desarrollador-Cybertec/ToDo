export * from './enums';
export * from './auth';
export * from './user';
export * from './area';
export * from './task';
export * from './meeting';
export * from './dashboard';
export * from './settings';

export interface ApiResponse<T> {
  data: T;
}

export interface ApiMessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}
