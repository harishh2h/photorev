export interface PaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

const DEFAULT_PAGE = 1 as const;
const DEFAULT_PAGE_SIZE = 25 as const;
const MAX_PAGE_SIZE = 100 as const;

export function applyPagination(
  query: any,
  params: PaginationParams,
): any {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const rawPageSize =
    params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const pageSize =
    rawPageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : rawPageSize;
  const offset = (page - 1) * pageSize;
  return query.offset(offset).limit(pageSize);
}

export function buildPaginatedResult<T>(
  items: readonly T[],
  total: number,
  page?: number,
  pageSize?: number,
): PaginatedResult<T> {
  const currentPage = page && page > 0 ? page : DEFAULT_PAGE;
  const rawPageSize =
    pageSize && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const safePageSize =
    rawPageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : rawPageSize;
  return {
    items,
    total,
    page: currentPage,
    pageSize: safePageSize,
  };
}

