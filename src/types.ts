export type PaginationFilters = Record<
  string,
  | string
  | number
  | boolean
  | {
    value: string | number | boolean;
    operator?: string;
  }
>;

export type PaginationOrder = Record<string, 0 | 1>;

export type PaginationDataResult<Key extends string, T> = {
  [K in Key]: T[];
};

export type PaginationOffsetResult<K extends string, T> = PaginationDataResult<K, T> & {
  total: number;
  page: number;
  limit: number;
  total_page: number;
};

export type PaginationCursorResult<K extends string, T> = PaginationDataResult<K, T> & {
  nextCursor: T | null;
  prevCursor: T | null;
  direction: 'next' | 'prev';
};
