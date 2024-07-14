import { PaginationFilters, PaginationOrder } from "./types";

export class PaginationOffsetDto {
  page?: number;
  limit?: number;
  filters?: PaginationFilters;
  order?: PaginationOrder;
}

export class PaginationCursorDto {
  cursor?: string;
  direction?: 'next' | 'prev';
  limit?: number;
  filters?: PaginationFilters;
  order?: PaginationOrder;
}
