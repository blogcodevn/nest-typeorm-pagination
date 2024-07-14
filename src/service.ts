import { Injectable } from "@nestjs/common";
import { ALLOW_OPERATORS, DEFAULT_LIMIT, getCursorDirection, isBaseType, MAX_LIMIT } from "./utils";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { PaginationCursorResult, PaginationFilters, PaginationOffsetResult } from "./types";
import { PaginationCursorDto, PaginationOffsetDto } from "./dto";

@Injectable()
export class PaginationService {
  private filterMapping: Record<string, string> = {};
  private defaultLimit = DEFAULT_LIMIT;
  private maxLimit = MAX_LIMIT;
  private entityName: string;
  private resultName: string = 'data';
  private primaryKey: string = 'id';

  setFilterMapping(mapping: Record<string, string>) {
    this.filterMapping = { ...mapping };
    return this;
  }

  setDefaultLimit(limit: number) {
    if (limit <= 0) {
      return this;
    }

    this.defaultLimit = limit;
    return this;
  }

  setMaxLimit(limit: number) {
    if (limit <= 0) {
      return this;
    }

    this.maxLimit = limit;
    return this;
  }

  setEntityName(name: string) {
    this.entityName = name;
    return this;
  }

  setResultName(name: string) {
    if (!name) {
      return this;
    }

    this.resultName = name;
    return this;
  }

  setPrimaryKey(key: string) {
    if (!key) {
      return this;
    }

    this.primaryKey = key;
    return this;
  }

  private getOperator(operator: string | undefined): string {
    if (!operator) {
      return '=';
    }

    return ALLOW_OPERATORS.includes(operator.toLowerCase())
      ? operator.toLowerCase()
      : '=';
  }

  private getLimit(limit: number | undefined) {
    return limit && limit > 0 && limit <= this.maxLimit
      ? limit
      : this.defaultLimit;
  }

  private applyFilterCondition<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    dbField: string,
    key: string,
    filter: string | number | boolean | { value: any; operator?: string },
  ) {
    if (isBaseType(filter)) {
      query.andWhere(`${dbField} = :${key}`, { [key]: filter });
      return;
    }

    const operator = this.getOperator(filter.operator);
    const value = filter.value;

    const condition =
      {
        eq: `${dbField} = :${key}`,
        '=': `${dbField} = :${key}`,
        neq: `${dbField} != :${key}`,
        '!=': `${dbField} != :${key}`,
        gt: `${dbField} > :${key}`,
        '>': `${dbField} > :${key}`,
        lt: `${dbField} < :${key}`,
        '<': `${dbField} < :${key}`,
        gte: `${dbField} >= :${key}`,
        '>=': `${dbField} >= :${key}`,
        lte: `${dbField} <= :${key}`,
        '<=': `${dbField} <= :${key}`,
        like: `${dbField} LIKE :${key}`,
        ilike: `${dbField} ILIKE :${key}`,
        nlike: `${dbField} NOT LIKE :${key}`,
        nilike: `${dbField} NOT ILIKE :${key}`,
        is: `${dbField} IS :${key}`,
        isnot: `${dbField} IS NOT :${key}`,
        in: `${dbField} IN (:...${key})`,
        nin: `${dbField} NOT IN (:...${key})`,
        bw:
          Array.isArray(value) && value.length === 2
            ? `${dbField} BETWEEN :${key}Start AND :${key}End`
            : `${dbField} = :${key}`,
        nbw:
          Array.isArray(value) && value.length === 2
            ? `${dbField} NOT BETWEEN :${key}Start AND :${key}End`
            : `${dbField} != :${key}`,
      }[operator] || `${dbField} = :${key}`;

    const params = {
      [`${key}Start`]:
        Array.isArray(value) && value.length === 2 ? value[0] : undefined,
      [`${key}End`]:
        Array.isArray(value) && value.length === 2 ? value[1] : undefined,
      [key]: Array.isArray(value) && value.length === 1 ? value[0] : value,
    };

    query.andWhere(condition, params);
  }

  private applyFilters<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    filters: PaginationFilters,
  ) {
    if (!filters) {
      return;
    }

    Object.keys(filters).forEach((key) => {
      const dbField = this.filterMapping[key] || key;
      this.applyFilterCondition(query, dbField, key, filters[key]);
    });
  }

  private applyOrder<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    order: Record<string, 0 | 1> | undefined,
  ) {
    Object.entries(order || {}).forEach(([field, direction]) => {
      const dbField = this.filterMapping[field] || field;
      query.addOrderBy(dbField, +direction === 1 ? 'ASC' : 'DESC');
    });
  }

  async offset<T extends ObjectLiteral, K extends string = string>(
    repository: Repository<T>,
    dto: PaginationOffsetDto,
  ) {
    const { page = 1, limit, filters, order } = dto;

    const entityName = this.entityName || repository.metadata.tableName;
    const query = repository.createQueryBuilder(entityName);

    const latestLimit = this.getLimit(+limit!);
    const resultName = this.resultName;

    this.applyFilters(query, filters as PaginationFilters);
    this.applyOrder(query, order || {});

    const [result, total] = await query
      .skip((page - 1) * latestLimit)
      .take(latestLimit)
      .getManyAndCount();

    return {
      [resultName]: result as T[],
      total,
      page,
      limit: latestLimit,
      total_page: Math.ceil(total / latestLimit),
    } as PaginationOffsetResult<K, T>;
  }

  async cursor<T extends ObjectLiteral, K extends string = string>(
    repository: Repository<T>,
    dto: PaginationCursorDto,
  ) {
    const { cursor, limit, filters, order } = dto;

    const entityName = this.entityName || repository.metadata.tableName;
    const query = repository.createQueryBuilder(entityName);
    const direction = getCursorDirection(dto);
    const primary = this.primaryKey;

    this.applyFilters(query, filters as PaginationFilters);

    if (cursor) {
      const comparisonOperator = direction === 'next' ? '>' : '<';
      query.andWhere(`${entityName}.${primary} ${comparisonOperator} :cursor`, {
        cursor,
      });
    }

    const latestLimit = this.getLimit(+limit!);
    const resultName = this.resultName;

    query.take(latestLimit);
    this.applyOrder(query, order);

    query.orderBy(
      `${entityName}.${primary}`,
      direction === 'next' ? 'ASC' : 'DESC',
    );

    const result = await query.getMany();

    const nextCursor: T | null =
      result.length > 0 ? result[result.length - 1] : null;
    const prevCursor: T | null = result.length > 0 ? result[0] : null;

    return {
      [resultName]: result as T[],
      nextCursor,
      prevCursor,
      direction,
    } as PaginationCursorResult<K, T>;
  }

  async getCursorTotal<T extends ObjectLiteral>(
    repository: Repository<T>,
    dto: PaginationCursorDto,
  ) {
    const { filters } = dto;

    const entityName = this.entityName || repository.metadata.tableName;
    const query = repository.createQueryBuilder(entityName);

    this.applyFilters(query, filters as PaginationFilters);
    return await query.getCount();
  }

}
