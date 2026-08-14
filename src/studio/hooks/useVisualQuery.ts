'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Visual, DataModel, VisualQueryState } from '../types/dashboard';
import type { QueryResultData } from '../types/visuals';
import { buildSqlQuery } from '../lib/sql-builder';

interface UseVisualQueryResult extends VisualQueryState {
  refetch: () => void;
}

export function useVisualQuery(visual: Visual, dataModel: DataModel | null): UseVisualQueryResult {
  const [result, setResult] = useState<QueryResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, QueryResultData>>(new Map());

  const executeQuery = useCallback(async () => {
    if (!dataModel?.connectionId) {
      setError('Sem conexao de banco de dados');
      return;
    }

    const buckets = visual.buckets;
    const hasFields = (buckets.xAxis?.length || 0) + (buckets.legend?.length || 0) + (buckets.values?.length || 0) + (buckets.yAxis?.length || 0) + (buckets.details?.length || 0);

    if (hasFields === 0) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = JSON.stringify({ buckets, filters: visual.filters, connectionId: dataModel.connectionId });
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const { sql } = buildSqlQuery(buckets, visual.filters || [], dataModel);

      if (!sql) {
        setResult(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: dataModel.connectionId,
          sql,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${response.status}`);
      }

      const body = await response.json();

      if (!body.success) {
        throw new Error(body.error || 'Erro ao executar query');
      }

      const queryResult: QueryResultData = {
        columns: body.columns || [],
        rows: body.rows || [],
        executionTime: body.executionTime || 0,
      };

      cacheRef.current.set(cacheKey, queryResult);

      if (!controller.signal.aborted) {
        setResult(queryResult);
        setLoading(false);
        setError(null);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLoading(false);
      }
    }
  }, [visual.buckets, visual.filters, dataModel]);

  useEffect(() => {
    executeQuery();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [executeQuery]);

  return { result, loading, error, refetch: executeQuery };
}
