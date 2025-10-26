import { useCallback, useEffect, useState } from 'react';

interface Options {
  immediate?: boolean;
}

export function useRefreshableData(task: () => Promise<void>, options: Options = {}) {
  const { immediate = true } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await task();
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [task]);

  useEffect(() => {
    if (!immediate) {
      return;
    }

    refresh();
  }, [immediate, refresh]);

  return {
    refresh,
    isRefreshing,
    lastUpdated,
    error,
    setError
  };
}
