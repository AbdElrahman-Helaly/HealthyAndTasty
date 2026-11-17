import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/apiClient';

type QueryResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: unknown };

export function useLoyaltyQuery<T>(load: () => Promise<T>, revision = 0) {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<{
    load: typeof load;
    revision: number;
    retryCount: number;
    result: QueryResult<T>;
  }>();

  useEffect(() => {
    let current = true;
    function complete(result: QueryResult<T>) {
      if (current) setState({ load, revision, retryCount, result });
    }
    void load().then((data) => complete({ data }), (error: unknown) => complete({ error }));
    return () => { current = false; };
  }, [load, revision, retryCount]);

  const result = state?.load === load && state.revision === revision && state.retryCount === retryCount
    ? state.result
    : undefined;
  return { result, retry: () => setRetryCount((count) => count + 1) };
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function errorMessages(error: unknown, fallback: string): string[] {
  const message = error instanceof Error ? error.message : fallback;
  return [...new Set([message, ...(error instanceof ApiError ? error.errors : [])])];
}
