import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getEmployeeById,
  getEmployees,
  getRoles,
} from '@/services/employee.service';
import { useAsync } from './useAsync';
import type { ApiRole, CursorPagedResponse, Employee, EmployeeDetails } from '@/types';

// ---------------------------------------------------------------------------
// useEmployees — cursor-based paginated list
// ---------------------------------------------------------------------------

interface UseEmployeesState {
  items: Employee[];
  nextCursor: string | null;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: Error | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export function useEmployees(): UseEmployeesState {
  const [items, setItems] = useState<Employee[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
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

    getEmployees(PAGE_SIZE)
      .then((page: CursorPagedResponse<Employee>) => {
        if (cancelled || !mounted.current) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
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
    setNextCursor(null);
    setTick((t) => t + 1);
  }, []);

  const loadMore = useCallback(() => {
    if (!nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);

    getEmployees(PAGE_SIZE, nextCursor)
      .then((page: CursorPagedResponse<Employee>) => {
        if (!mounted.current) return;
        setItems((prev) => [...prev, ...page.items]);
        setNextCursor(page.nextCursor);
        setIsFetchingMore(false);
      })
      .catch((err: unknown) => {
        if (!mounted.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsFetchingMore(false);
      });
  }, [nextCursor, isFetchingMore]);

  return {
    items,
    nextCursor,
    isLoading,
    isFetchingMore,
    error,
    refetch,
    loadMore,
    hasMore: nextCursor !== null,
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
