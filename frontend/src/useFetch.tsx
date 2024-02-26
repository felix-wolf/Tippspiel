import { useEffect, useState } from "react";
import { useCache } from "./contexts/CacheContext";

type useFetchProps<T> = {
  key: string;
  initialEnabled?: boolean;
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
  func: (...args: any[]) => Promise<T>;
  args: any[];
};

export default function useFetch<T>({
  key,
  initialEnabled = true,
  cache = { enabled: true, ttl: 3 * 60 },
  func,
  args,
}: useFetchProps<T>) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<any>();
  const { getCache, setCache, deleteCache } = useCache();

  const refetch = (hard: boolean = false) => {
    setLoading(true);
    setError(undefined);
    if (cache?.enabled && getCache(key) !== undefined && !hard) {
      setData(getCache(key));
      setLoading(false);
      setError(undefined);
      return;
    }
    func(...args)
      .then((data) => {
        setData(data as T);
        if (cache?.enabled) setCache(key, data, cache.ttl);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  function inValidate(invalidationKey: string) {
    deleteCache(invalidationKey);
  }

  useEffect(() => {
    if (initialEnabled) refetch();
  }, []);

  return { loading, data, error, refetch, inValidate } as const;
}
