import { useEffect, useState } from "react";
import { useCache } from "./contexts/CacheContext";

type useFetchProps<T = any> = {
  key: string;
  initialEnabled?: boolean;
  cache: {
    enabled?: boolean;
    ttl?: number;
  };
  fetchFunction: (args: any) => Promise<T>;
  functionArgs?: any;
};

export default function useFetch<T = any>({
  key,
  initialEnabled = true,
  cache,
  fetchFunction,
  functionArgs = undefined,
}: useFetchProps) {
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
    fetchFunction(functionArgs)
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
