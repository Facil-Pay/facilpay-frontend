/**
 * lib/types/pagination.ts
 *
 * Generic pagination wrapper used by all list endpoints.
 *
 * Usage:
 *   const result = await apiClient.get<Paginated<Payment>>("/payments");
 *   const { data, meta } = result;
 */

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Generic paginated response envelope.
 * The API always returns `{ data: T[], meta: PaginationMeta }`.
 */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Convenience: params accepted by any list endpoint */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
