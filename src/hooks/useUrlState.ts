import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

interface UseUrlStateOptions {
  defaultValue?: string;
  paramName?: string;
  removeDefault?: boolean; // Remove param when it's the default value
}

/**
 * Hook for managing state in URL search params
 * Provides a simple interface similar to useState but persisted in URL
 */
export function useUrlState(
  key: string,
  options: UseUrlStateOptions = {}
): [string | null, (value: string | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const { defaultValue = null, paramName = key, removeDefault = true } = options;

  // Get current value from URL or use default
  const value = useMemo(() => {
    const paramValue = searchParams.get(paramName);
    return paramValue !== null ? paramValue : defaultValue;
  }, [searchParams, paramName, defaultValue]);

  // Set value in URL
  const setValue = useCallback(
    (newValue: string | null) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        
        if (newValue === null || (removeDefault && newValue === defaultValue)) {
          params.delete(paramName);
        } else {
          params.set(paramName, newValue);
        }
        
        return params;
      });
    },
    [setSearchParams, paramName, defaultValue, removeDefault]
  );

  return [value, setValue];
}

/**
 * Hook for managing multiple URL state values
 */
export function useUrlStates<T extends Record<string, string | null>>(
  defaultValues: T
): [T, (updates: Partial<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current values from URL
  const values = useMemo(() => {
    const result = { ...defaultValues };
    for (const key in defaultValues) {
      const paramValue = searchParams.get(key);
      if (paramValue !== null) {
        result[key] = paramValue as T[Extract<keyof T, string>];
      }
    }
    return result;
  }, [searchParams, defaultValues]);

  // Set multiple values in URL
  const setValues = useCallback(
    (updates: Partial<T>) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === defaultValues[key]) {
            params.delete(key);
          } else {
            params.set(key, value as string);
          }
        }
        
        return params;
      });
    },
    [setSearchParams, defaultValues]
  );

  return [values, setValues];
}

/**
 * Hook for managing pagination state in URL
 */
export function useUrlPagination(defaultPageSize = 20) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10);
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;

  const setPagination = useCallback(
    (updates: {
      page?: number;
      pageSize?: number;
      sortBy?: string | null;
      sortOrder?: 'asc' | 'desc' | null;
    }) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        
        if (updates.page !== undefined) {
          if (updates.page === 1) {
            params.delete('page');
          } else {
            params.set('page', String(updates.page));
          }
        }
        
        if (updates.pageSize !== undefined) {
          if (updates.pageSize === defaultPageSize) {
            params.delete('pageSize');
          } else {
            params.set('pageSize', String(updates.pageSize));
          }
        }
        
        if (updates.sortBy !== undefined) {
          if (updates.sortBy === null) {
            params.delete('sortBy');
          } else {
            params.set('sortBy', updates.sortBy);
          }
        }
        
        if (updates.sortOrder !== undefined) {
          if (updates.sortOrder === null) {
            params.delete('sortOrder');
          } else {
            params.set('sortOrder', updates.sortOrder);
          }
        }
        
        return params;
      });
    },
    [setSearchParams, defaultPageSize]
  );

  return {
    page,
    pageSize,
    sortBy,
    sortOrder,
    setPagination,
    setPage: (page: number) => setPagination({ page }),
    setPageSize: (pageSize: number) => setPagination({ pageSize }),
    setSort: (sortBy: string | null, sortOrder?: 'asc' | 'desc' | null) =>
      setPagination({ sortBy, sortOrder }),
  };
}

/**
 * Hook for managing filter state in URL
 */
export function useUrlFilters<T extends Record<string, string | string[] | null>>(
  defaultFilters: T
): [T, (filters: Partial<T>) => void, () => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = { ...defaultFilters };
    
    for (const key in defaultFilters) {
      const defaultValue = defaultFilters[key];
      
      if (Array.isArray(defaultValue)) {
        // Handle array filters (multiple values)
        const values = searchParams.getAll(key);
        result[key] = values.length > 0 ? values : defaultValue as T[Extract<keyof T, string>];
      } else {
        // Handle single value filters
        const value = searchParams.get(key);
        if (value !== null) {
          result[key] = value as T[Extract<keyof T, string>];
        }
      }
    }
    
    return result;
  }, [searchParams, defaultFilters]);

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        
        for (const [key, value] of Object.entries(updates)) {
          // First, delete all existing values for this key
          params.delete(key);
          
          if (value === null || value === defaultFilters[key]) {
            // Don't add anything if it's null or default
            continue;
          }
          
          if (Array.isArray(value)) {
            // Add multiple values for array filters
            for (const v of value) {
              params.append(key, v);
            }
          } else {
            // Add single value
            params.set(key, value as string);
          }
        }
        
        return params;
      });
    },
    [setSearchParams, defaultFilters]
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      
      // Remove all filter params
      for (const key in defaultFilters) {
        params.delete(key);
      }
      
      return params;
    });
  }, [setSearchParams, defaultFilters]);

  return [filters, setFilters, clearFilters];
}