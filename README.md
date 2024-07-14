# @blogcode/nest-typeorm-pagination

- Current support `PostgreSQL`, `MySQL`, `MariaDB`.
- Others DB does not tested.

## Installation

Install dependencies

```bash
# npm
npm i @nestjs/common typeorm

# OR

# yarn
yarn add @nestjs/common typeorm
```

Install package

```bash
# npm
npm i @blogcode/nest-typeorm-pagination

# OR

# yarn
yarn add @blogcode/nest-typeorm-pagination
```

## Using

### Filter string for Offset bases

```
page=1&limit=10&filters[name]=abc&filters[age][value]=18&filters[age][operator]=gte&order[name]=1&order[age]=0
```

- `page=1`: Get page 1, offset 0
- `limit=10`: Per page 10 records.
- `filters[name]=abc`: Field `name` or alias `name` equal to `abc`.
- `filters[age][value]=18`: Field `age` or alias `age` will be compare.
- `filters[age][operator]=gte`: Field `age` or alias `age` compare greater than or equal to `18`.
- `order[name]=1`: Order by `name` or alias `name` is `DESC`.
- `order[age]=0`: Order by `age` or alias `age` is `ASC`.

### Filter string for Cursor based

```
cursor=10&limit=10&direction=next&filters[name]=abc&filters[age][value]=18&filters[age][operator]=gte&order[name]=1&order[age]=0
```

- `cursor=10`: This indicates the current position in the dataset. The cursor is typically a unique identifier or an offset that helps the server know where to continue fetching records from.
- `limit=10`: This specifies the number of records to return in the response. In this case, the client is requesting 10 records.
- `direction=next`: This indicates the direction in which to paginate. The value `next` suggests that the client wants to fetch the next set of records following the current cursor position.
- `filters[name]=abc`: This applies a filter on the `name` field, where the value must be `abc`.
- `filters[age][value]=18` and `filters[age][operator]=gte`: These two parameters work together to filter the `age` field. The `value` is set to `18`, and the `operator` is `gte`, which stands for "greater than or equal to." Thus, this filter will include records where the age is 18 or older.
- `order[name]=1` and `order[age]=0`: These parameters specify the sorting order of the results. The `order[name]=1` indicates that the results should be sorted by the `name` field in ascending order, while `order[age]=0` indicates that the results should be sorted by the `age` field in descending order.

### Operator

| Operator Group | Description                                                            |
|----------------|------------------------------------------------------------------------|
| `eq`, `=`      | Equal to                                                               |
| `neq`, `!=`    | Not equal to                                                           |
| `gt`, `>`      | Greater than                                                           |
| `lt`, `<`      | Less than                                                              |
| `gte`, `>=`    | Greater than or equal to                                               |
| `lte`, `<=`    | Less than or equal to                                                  |
| `in`           | In (within a specified set)                                            |
| `nin`          | Not in (not within a specified set)                                    |
| `like`         | Like (matches a pattern)                                               |
| `ilike`        | Case-insensitive like (matches a pattern)                              |
| `nlike`        | Not like (does not match a pattern)                                    |
| `nilike`       | Case-insensitive not like (does not match a pattern)                   |
| `is`           | Is (matches a specific value, often used for null checks)              |
| `isnot`        | Is not (does not match a specific value, often used for null checks)   |
| `bw`           | Between (within a specified range)                                     |
| `nbw`          | Not between (not within a specified range)                             |

### DEFAULT_LIMIT

```typescript
export const DEFAULT_LIMIT = 10;
```
- **Description**: This constant sets the default limit for pagination to 10 records.

### MAX_LIMIT

```typescript
export const MAX_LIMIT = 1000;
```
- **Description**: This constant sets the maximum limit for pagination to 1000 records.

## Functions

### isBaseType

```typescript
export function isBaseType(value: any): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}
```
- **Description**: Checks if the given value is a base type (string, number, or boolean).
- **Parameters**:
  - `value`: The value to check.
- **Returns**: `true` if the value is a string, number, or boolean; otherwise `false`.

### getFilters

```typescript
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
```
- **Description**: Extracts filters from the query object.
- **Parameters**:
  - `query`: An object containing the query parameters.
- **Returns**: An object representing the filters for pagination.

### getOrder
```typescript
export function getOrder(query: Record<string, any> | undefined) {
  const order: PaginationOrder = {};

  if (typeof query?.order === 'object') {
    Object.keys(query.order).forEach((key) => {
      order[key] = parseInt(query.order[key]) === 1 ? 1 : 0;
    });
  }

  return order;
}
```
- **Description**: Extracts the order for sorting from the query object.
- **Parameters**:
  - `query`: An object containing the query parameters.
- **Returns**: An object representing the order for pagination.

### getCursorDirection
```typescript
export function getCursorDirection(query: Record<string, any> | undefined) {
  const direction = query?.direction as string;
  return direction?.toLowerCase() === 'prev' ? 'prev' : 'next';
}
```
- **Description**: Determines the cursor direction for pagination from the query object.
- **Parameters**:
  - `query`: An object containing the query parameters.
- **Returns**: A string indicating the cursor direction (`'prev'` or `'next'`).

## Decorators

### Offset
- **Description**: This decorator is used to extract pagination parameters from the request query for offset-based pagination.
- **Returns**: An object of type `PaginationOffsetDto` containing the following properties:
  - `page`: The current page number, defaulting to 1 if not provided in the query.
  - `limit`: The number of records per page, defaulting to `DEFAULT_LIMIT` if not provided in the query.
  - `filters`: An object representing the filters for pagination, extracted from the query.
  - `order`: An object representing the order for sorting, extracted from the query.

#### Usage Example in a Controller
```typescript
// src/modules/item.repo.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaginationService, PaginationOffsetDto } from '@blogcode/nest-typeorm-pagination';

@Injectable()
export class ItemService {
  constructor(
    private readonly itemRepo: Repository<ItemEntity>,
    private readonly paginationService: PaginationService,
  ) {
    this.paginationService.setPrimaryKey('id'); // value `id` is default inside package.
    // Set others value if need
  }

  getItemsOffset(query: PaginationOffsetDto) {
    return this.paginationService.offset(this.itemRepo, query);
  }

  getItemsCursor(query: PaginationCursorDto) {
    return this.paginationService.cursor(this.itemRepo, query);
  }

  getTotalItemCursor(query: PaginationCursorDto) {
    return this.paginationService.getCursorTotal(this.itemRepo, query);
  }
}
```

```typescript
// src/modules/item.controlller.ts
import { Controller, Get } from '@nestjs/common';
import { Offset, PaginationOffsetDto } from '@blogcode/nest-typeorm-pagination';
import { ItemRepo } from './item.repo';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemRepo: ItemRepo) {}
  @Get('get-paging-items-by-offset')
  getItems(@Offset() query: PaginationOffsetDto) {
    // Your logic to handle the pagination
    return this.itemsService.getItemsOffset(query);
  }
}
```

### Cursor
- **Description**: This decorator is used to extract pagination parameters from the request query for cursor-based pagination.
- **Returns**: An object of type `PaginationOffsetDto` containing the following properties:
  - `cursor`: The current cursor position, extracted from the query.
  - `direction`: The direction of pagination (`'prev'` or `'next'`), determined from the query.
  - `limit`: The number of records to return, defaulting to `DEFAULT_LIMIT` if not provided in the query.
  - `filters`: An object representing the filters for pagination, extracted from the query.
  - `order`: An object representing the order for sorting, extracted from the query.

#### Usage Example in a Controller
```typescript
// src/modules/item.controlller.ts
import { Controller, Get } from '@nestjs/common';
import { Offset, PaginationCursorDto } from '@blogcode/nest-typeorm-pagination';
import { ItemRepo } from './item.repo';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemRepo: ItemRepo) {}
  @Get('get-paging-items-by-cursor')
  getItems(@Cursor() query: PaginationCursorDto) {
    // Your logic to handle the pagination
    return this.itemsService.getItemsCursor(query);
  }
}
```

## Class: PaginationService

PaginationService provides methods for performing data pagination in two ways: offset-based and cursor-based. It supports applying filters, sorting, and setting limits on the number of returned results.

### setFilterMapping

```typescript
setFilterMapping(mapping: Record<string, string>): this
```

- **Description**: Sets the mapping between DTO fields and database fields.
- **Parameters**:
  - `mapping`: Object mapping between DTO field names and database field names.
- **Returns**: `this` - allows method chaining.

### setDefaultLimit

```typescript
setDefaultLimit(limit: number): this
```

- **Description**: Sets the default limit for the number of returned results.
- **Parameters**:
  - `limit`: Default number of results (must be greater than 0).
- **Returns**: `this` - allows method chaining.

### setMaxLimit

```typescript
setMaxLimit(limit: number): this
```

- **Description**: Sets the maximum limit for the number of returned results.
- **Parameters**:
  - `limit`: Maximum number of results (must be greater than 0).
- **Returns**: `this` - allows method chaining.

### setEntityName

```typescript
setEntityName(name: string): this
```

- **Description**: Sets the entity name for the queries.
- **Parameters**:
  - `name`: Name of the entity.
- **Returns**: `this` - allows method chaining.

### setResultName

```typescript
setResultName(name: string): this
```

- **Description**: Sets the field name for the returned results.
- **Parameters**:
  - `name`: Name of the result field.
- **Returns**: `this` - allows method chaining.

### setPrimaryKey

```typescript
setPrimaryKey(key: string): this
```

- **Description**: Sets the primary key of the entity.
- **Parameters**:
  - `key`: Name of the primary key.
- **Returns**: `this` - allows method chaining.

### offset

```typescript
async offset<T extends ObjectLiteral, K extends string = string>(
  repository: Repository<T>,
  dto: PaginationOffsetDto,
): Promise<PaginationOffsetResult<K, T>>
```

- **Description**: Performs offset-based pagination.
- **Parameters**:
  - `repository`: Repository of the entity.
  - `dto`: DTO object containing pagination, filters, and sorting information.
- **Returns**: `Promise<PaginationOffsetResult<K, T>>` - Result of offset-based pagination.

### cursor

```typescript
async cursor<T extends ObjectLiteral, K extends string = string>(
  repository: Repository<T>,
  dto: PaginationCursorDto,
): Promise<PaginationCursorResult<K, T>>
```

- **Description**: Performs cursor-based pagination.
- **Parameters**:
  - `repository`: Repository of the entity.
  - `dto`: DTO object containing pagination, filters, sorting information, and cursor.
- **Returns**: `Promise<PaginationCursorResult<K, T>>` - Result of cursor-based pagination, including next and previous cursors.

### getCursorTotal

```typescript
async getCursorTotal<T extends ObjectLiteral>(
  repository: Repository<T>,
  dto: PaginationCursorDto,
): Promise<number>
```

- **Description**: Retrieves the total number of items based on the filters for cursor-based pagination.
- **Parameters**:
  - `repository`: Repository of the entity.
  - `dto`: DTO object containing filter information.
- **Returns**: `Promise<number>` - Total number of items based on the filters.
