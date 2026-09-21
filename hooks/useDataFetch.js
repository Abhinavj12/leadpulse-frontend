import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api/axios';

export function useDataFetch(initialUrl = null, options = {}) {
  const [url, setUrl] = useState(initialUrl);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { initialFetch = true, defaultData = null } = options;

  const execute = useCallback(async (fetchUrl = url, fetchOptions = {}) => {
    if (!fetchUrl) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api({
        url: fetchUrl,
        ...fetchOptions,
      });
      
      const payload = response.data?.data ?? response.data;
      setData(payload);
      return payload;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (initialFetch && url) {
      execute();
    }
  }, [url, initialFetch, execute]);

  const isEmpty = data === null || (Array.isArray(data) && data.length === 0);

  return {
    data: data || defaultData,
    loading,
    error,
    isEmpty,
    execute,
    setUrl,
  };
}
