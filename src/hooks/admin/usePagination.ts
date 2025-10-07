import { useState, useCallback } from 'react';
import { calculatePaginationRange, PAGINATION_CONFIG } from '@/utils/admin/pagination';

interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const {
    pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    initialPage = 1,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const { from, to } = calculatePaginationRange(currentPage, pageSize);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    currentPage,
    pageSize,
    from,
    to,
    goToPage,
    nextPage,
    previousPage,
    reset,
  };
};
