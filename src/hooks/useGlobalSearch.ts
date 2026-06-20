import { useEffect, useState } from 'react';
import { globalSearch } from '@/services/search.service';
import type { SearchResults } from '@/types';

const emptyResults: SearchResults = {
  branches: [],
  employees: [],
  products: [],
  categories: [],
};

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      globalSearch(trimmed)
        .then(setResults)
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const displayResults = query.trim() ? results : emptyResults;

  const total =
    displayResults.branches.length +
    displayResults.employees.length +
    displayResults.products.length +
    displayResults.categories.length;

  return { results: displayResults, isLoading, total };
}
