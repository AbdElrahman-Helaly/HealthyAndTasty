import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getBranches,
  getBranchById,
  getBranchEmployees,
  getBranchEmployeeRoles,
} from '@/services/branch.service';
import { useAsync } from './useAsync';
import type {
  Branch,
  BranchEmployee,
  EmployeeRole,
  PaginatedResponse,
} from '@/types';

// ---------------------------------------------------------------------------
// useBranches — flat list with optional country filter
// ---------------------------------------------------------------------------

export function useBranches(country?: string) {
  return useAsync(
    () => getBranches(country),
    [country],
  );
}

// ---------------------------------------------------------------------------
// useBranchDetails — single branch by id
// ---------------------------------------------------------------------------

export function useBranchDetails(id: string | undefined): {
  data: Branch | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useAsync(
    () => (id ? getBranchById(id) : Promise.resolve(null)),
    [id],
  );
}

// ---------------------------------------------------------------------------
// useBranchEmployees — paginated list for a branch
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 20;

export function useBranchEmployees(branchId: string | undefined): {
  data: PaginatedResponse<BranchEmployee> | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
} {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<PaginatedResponse<BranchEmployee> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!branchId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getBranchEmployees({ branchId, page, pageSize: DEFAULT_PAGE_SIZE })
      .then((result) => {
        if (cancelled || !mounted.current) return;
        setData(result);
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
  }, [branchId, page, tick]);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    page,
    setPage,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

// ---------------------------------------------------------------------------
// useBranchEmployeeRoles — available roles from the API
// ---------------------------------------------------------------------------

export function useBranchEmployeeRoles(): {
  data: EmployeeRole[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const result = useAsync(getBranchEmployeeRoles, []);
  return {
    ...result,
    data: result.data ?? [],
  };
}
