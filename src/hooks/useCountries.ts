import { getCountries, getCountryById } from '@/services/country.service';
import { useAsync } from './useAsync';

export function useCountries() {
  return useAsync(getCountries, []);
}

export function useCountry(id: string | undefined) {
  return useAsync(
    () => (id ? getCountryById(id) : Promise.resolve(null)),
    [id],
  );
}
