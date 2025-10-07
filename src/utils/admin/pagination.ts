export const PAGINATION_CONFIG = {
  GUIDES_PER_PAGE: 20,
  REVIEWS_PER_PAGE: 25,
  DESTINATIONS_PER_PAGE: 30,
  DEFAULT_PAGE_SIZE: 20,
} as const;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const calculatePaginationRange = (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

export const calculateTotalPages = (totalCount: number, pageSize: number) => {
  return Math.ceil(totalCount / pageSize);
};

export const createPaginationResult = <T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number
): PaginationResult<T> => {
  const totalPages = calculateTotalPages(totalCount, pageSize);
  
  return {
    data,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
