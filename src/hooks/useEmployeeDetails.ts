import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getEmployeeById,
  getRoles,
} from '@/services/employee.service';
import { getAllBranchEmployees } from '@/services/branch.service';
import { useAsync } from './useAsync';
import type { ApiRole, BranchEmployee, EmployeeDetails, PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// useEmployees — page-based branch-employees list
// ---------------------------------------------------------------------------

interface UseEmployeesState {
  items: BranchEmployee[];
  totalCount: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: Error | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export function useEmployees(): UseEmployeesState {
  const [items, setItems] = useState<BranchEmployee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Initial / refetch load
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch lifecycle
    setIsLoading(true);
    setError(null);

    getAllBranchEmployees(1, PAGE_SIZE)
      .then((pageResult: PaginatedResponse<BranchEmployee>) => {
        if (cancelled || !mounted.current) return;
        setItems(pageResult.items);
        setTotalCount(pageResult.total);
        setPage(pageResult.page);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled || !mounted.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refetch = useCallback(() => {
    setItems([]);
    setTotalCount(0);
    setPage(1);
    setTick((t) => t + 1);
  }, []);

  const loadMore = useCallback(() => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);

    const nextPage = page + 1;
    getAllBranchEmployees(nextPage, PAGE_SIZE)
      .then((pageResult: PaginatedResponse<BranchEmployee>) => {
        if (!mounted.current) return;
        setItems((prev) => [...prev, ...pageResult.items]);
        setTotalCount(pageResult.total);
        setPage(pageResult.page);
        setIsFetchingMore(false);
      })
      .catch((err: unknown) => {
        if (!mounted.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsFetchingMore(false);
      });
  }, [page, isFetchingMore]);

  return {
    items,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    isLoading,
    isFetchingMore,
    error,
    refetch,
    loadMore,
    hasMore: items.length < totalCount,
  };
}

// ---------------------------------------------------------------------------
// useEmployeeDetails — on-demand single employee fetch
// ---------------------------------------------------------------------------

export function useEmployeeDetails(id: string | undefined): {
  data: EmployeeDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useAsync(
    () => (id ? getEmployeeById(id) : Promise.resolve(null)),
    [id],
  );
}

// ---------------------------------------------------------------------------
// useRoles — load available roles from API
// ---------------------------------------------------------------------------

export function useRoles(): {
  data: ApiRole[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const result = useAsync(getRoles, []);
  return {
    ...result,
    data: result.data ?? [],
  };
}
