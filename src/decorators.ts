import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { DEFAULT_LIMIT, getCursorDirection, getFilters, getOrder } from "./utils";
import { PaginationOffsetDto } from "./dto";

export const Offset = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const { query } = ctx.switchToHttp().getRequest<Request>();

  const page = parseInt(query?.page as string) || 1;
  const limit = parseInt(query?.limit as string) || DEFAULT_LIMIT;
  const filters = getFilters(query);
  const order = getOrder(query);

  return { page, limit, filters, order } as PaginationOffsetDto;
});

export const Cursor = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const { query } = ctx.switchToHttp().getRequest<Request>();

  const cursor = query?.cursor as string;
  const direction = getCursorDirection(query);
  const limit = parseInt(query?.limit as string) || DEFAULT_LIMIT;
  const filters = getFilters(query);
  const order = getOrder(query);

  return { limit, direction, cursor, filters, order } as PaginationOffsetDto;
});
