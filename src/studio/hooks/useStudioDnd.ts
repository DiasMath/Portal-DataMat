import { useCallback } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { StudioState, StudioAction } from '../types/state';
import type { BucketField, VisualBuckets } from '../types/visuals';
import { BUCKET_FIELD_RULES } from '../types/visuals';

interface UseStudioDndProps {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
  setActiveDragData: (data: Record<string, unknown> | null) => void;
}

export function useStudioDnd({ state, dispatch, setActiveDragData }: UseStudioDndProps) {
  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (state.pendingFilterDrop) {
      dispatch({ type: 'SET_PENDING_FILTER_DROP', payload: null });
    }
    setActiveDragData(event.active.data.current as Record<string, unknown> | null);
  }, [state.pendingFilterDrop, dispatch, setActiveDragData]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    if (activeData.type === 'bucket-field' && overData.type === 'bucket') {
      const field: BucketField = {
        tableName: activeData.tableName,
        fieldName: activeData.fieldName,
        aggregation: activeData.aggregation || 'NONE',
      };

      if (activeData.sourceVisualId === overData.visualId && activeData.sourceBucket === overData.bucketKey) {
        return;
      }

      const page = state.pages.find(p => p.id === state.activePageId);
      const targetVisual = page?.visuals.find(v => v.id === overData.visualId);
      if (targetVisual) {
        const rules = BUCKET_FIELD_RULES[targetVisual.type];
        const acceptedType = rules?.[overData.bucketKey] || 'any';
        if (acceptedType !== 'any') {
          const fieldType = activeData.fieldType as 'string' | 'number' | 'date' | 'boolean' | undefined;
          if (fieldType) {
            const isValid = acceptedType === 'numeric'
              ? fieldType === 'number'
              : fieldType === 'string' || fieldType === 'date' || fieldType === 'boolean';
            if (!isValid) return;
          }
        }
      }

      if (activeData.sourceVisualId && activeData.sourceBucket !== undefined) {
        dispatch({
          type: 'REMOVE_BUCKET_FIELD',
          payload: {
            visualId: activeData.sourceVisualId,
            bucket: activeData.sourceBucket as keyof VisualBuckets,
            index: activeData.sourceIndex,
          },
        });
      }

      dispatch({
        type: 'SET_BUCKET_FIELD',
        payload: {
          visualId: overData.visualId,
          bucket: overData.bucketKey,
          field,
        },
      });
      return;
    }

    if (activeData.type === 'field' && overData.type === 'bucket') {
      const field: BucketField = {
        tableName: activeData.tableName,
        fieldName: activeData.fieldName,
        aggregation: activeData.isAggregatable ? 'SUM' : 'NONE',
      };

      dispatch({
        type: 'SET_BUCKET_FIELD',
        payload: {
          visualId: overData.visualId,
          bucket: overData.bucketKey,
          field,
        },
      });
    }

    if (activeData.type === 'measure' && overData.type === 'bucket') {
      const field: BucketField = {
        tableName: '__measure__',
        fieldName: activeData.measureId,
        aggregation: 'NONE',
      };

      dispatch({
        type: 'SET_BUCKET_FIELD',
        payload: {
          visualId: overData.visualId,
          bucket: overData.bucketKey,
          field,
        },
      });
    }

    if (activeData.type === 'field' && overData.type === 'filter-section') {
      dispatch({
        type: 'SET_PENDING_FILTER_DROP',
        payload: {
          sectionId: overData.sectionId,
          tableName: activeData.tableName,
          columnName: activeData.fieldName,
        },
      });
    }

    if (activeData.type === 'measure' && overData.type === 'filter-section') {
      dispatch({
        type: 'SET_PENDING_FILTER_DROP',
        payload: {
          sectionId: overData.sectionId,
          tableName: '__measure__',
          columnName: activeData.measureId,
        },
      });
    }
  }, [state, dispatch, setActiveDragData]);

  return { handleDragStart, handleDragEnd };
}
