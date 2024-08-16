import { PaginationFilters, PaginationOrder } from "./types";

export const DEFAULT_LIMIT = 10;

export const MAX_LIMIT = 1000;

export function isBaseType(value: any): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

export function getFilters(query: Record<string, any> | undefined) {
  const filters: PaginationFilters = {};

  if (typeof query?.filters === 'object') {
    Object.keys(query.filters).forEach((key) => {
      const value = query.filters[key];

      if (typeof value === 'object') {
        filters[key] = {
          value: value.value,
          operator: value.operator,
        };
      } else if (isBaseType(value)) {
        filters[key] = {
          value,
          operator: 'eq',
        };
      }
    });
  }

  return filters;
}

export function getOrder(query: Record<string, any> | undefined) {
  const order: PaginationOrder = {};

  if (typeof query?.order === 'object') {
    Object.keys(query.order).forEach((key) => {
      order[key] = parseInt(query.order[key]) === 1 ? 1 : 0;
    });
  }

  return order;
}

export function getCursorDirection(query: Record<string, any> | undefined) {
  const direction = query?.direction as string;
  return direction?.toLowerCase() === 'prev' ? 'prev' : 'next';
}
