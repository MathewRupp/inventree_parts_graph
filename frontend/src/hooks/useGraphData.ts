import { useState, useEffect, useCallback, useRef } from 'react';
import { GraphData, FilterState, PartDetail } from '../types';

interface UseGraphDataResult {
  data: GraphData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchPartDetail: (partId: number) => Promise<PartDetail | null>;
  fetchSubgraph: (partId: number, depth?: number) => Promise<GraphData | null>;
}

export function useGraphData(
  baseUrl: string,
  filters: FilterState,
  fetchFn: (url: string) => Promise<Response>
): UseGraphDataResult {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('active', String(filters.active));
    params.set('metric', filters.metric);
    if (filters.category !== null) params.set('category', String(filters.category));
    if (filters.purchaseable !== null) params.set('purchaseable', String(filters.purchaseable));
    if (filters.assembly !== null) params.set('assembly', String(filters.assembly));
    if (filters.minWeight > 0) params.set('min_weight', String(filters.minWeight));
    if (filters.search) params.set('search', filters.search);
    return `${baseUrl}graph/data/?${params.toString()}`;
  }, [baseUrl, filters]);

  const fetchData = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const url = buildUrl();
      const resp = await fetchFn(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const json = await resp.json();
      setData(json as GraphData);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch graph data');
    } finally {
      setLoading(false);
    }
  }, [buildUrl, fetchFn]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  const fetchPartDetail = useCallback(async (partId: number): Promise<PartDetail | null> => {
    try {
      const resp = await fetchFn(`${baseUrl}part/${partId}/detail/`);
      if (!resp.ok) return null;
      return await resp.json() as PartDetail;
    } catch {
      return null;
    }
  }, [baseUrl, fetchFn]);

  const fetchSubgraph = useCallback(async (partId: number, depth = 2): Promise<GraphData | null> => {
    try {
      const resp = await fetchFn(`${baseUrl}graph/subgraph/?part_id=${partId}&depth=${depth}`);
      if (!resp.ok) return null;
      return await resp.json() as GraphData;
    } catch {
      return null;
    }
  }, [baseUrl, fetchFn]);

  return { data, loading, error, refetch: fetchData, fetchPartDetail, fetchSubgraph };
}
