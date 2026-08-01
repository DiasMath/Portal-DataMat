import { studioReducer, getInitialState } from './StudioContext';
import type { StudioState, StudioAction } from '../types/state';
import type { DataModel } from '../types/dashboard';
import type { BucketField, VisualBuckets } from '../types/visuals';
import { MOCK_DATA_MODEL } from '../lib/mock-data';

describe('studioReducer', () => {
  let state: StudioState;

  beforeEach(() => {
    state = getInitialState('editor');
  });

  describe('Dashboard actions', () => {
    it('SET_DASHBOARD_NAME updates name and marks dirty', () => {
      const result = studioReducer(state, { type: 'SET_DASHBOARD_NAME', payload: 'Meu Dashboard' });
      expect(result.dashboardName).toBe('Meu Dashboard');
      expect(result.isDirty).toBe(true);
    });

    it('MARK_CLEAN resets dirty flag', () => {
      state.isDirty = true;
      const result = studioReducer(state, { type: 'MARK_CLEAN' });
      expect(result.isDirty).toBe(false);
    });
  });

  describe('Page actions', () => {
    it('ADD_PAGE adds a new page and sets it active', () => {
      const result = studioReducer(state, { type: 'ADD_PAGE', payload: { name: 'Página 2' } });
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].name).toBe('Página 2');
      expect(result.activePageId).toBe(result.pages[0].id);
    });

    it('REMOVE_PAGE removes page and updates active', () => {
      state.pages = [
        { id: 'p1', name: 'P1', order: 0, visuals: [] },
        { id: 'p2', name: 'P2', order: 1, visuals: [] },
      ];
      state.activePageId = 'p1';
      const result = studioReducer(state, { type: 'REMOVE_PAGE', payload: 'p1' });
      expect(result.pages).toHaveLength(1);
      expect(result.activePageId).toBe('p2');
    });

    it('SET_ACTIVE_PAGE changes active page', () => {
      state.pages = [
        { id: 'p1', name: 'P1', order: 0, visuals: [] },
        { id: 'p2', name: 'P2', order: 1, visuals: [] },
      ];
      state.activePageId = 'p1';
      const result = studioReducer(state, { type: 'SET_ACTIVE_PAGE', payload: 'p2' });
      expect(result.activePageId).toBe('p2');
    });
  });

  describe('Visual actions', () => {
    beforeEach(() => {
      state.pages = [{ id: 'p1', name: 'P1', order: 0, visuals: [] }];
      state.activePageId = 'p1';
    });

    it('ADD_VISUAL adds visual to active page', () => {
      const result = studioReducer(state, { type: 'ADD_VISUAL', payload: { type: 'bar', x: 100, y: 100 } });
      const page = result.pages.find(p => p.id === 'p1');
      expect(page?.visuals).toHaveLength(1);
      expect(page?.visuals[0].type).toBe('bar');
      expect(page?.visuals[0].x).toBe(100);
      expect(result.selectedVisualId).toBe(page?.visuals[0].id);
    });

    it('REMOVE_VISUAL removes visual from page', () => {
      state.pages[0].visuals = [{ id: 'v1', type: 'bar', x: 0, y: 0, width: 400, height: 300, zIndex: 1, title: 'Test', showTitle: true, buckets: {}, formatting: {}, filters: [] }];
      state.selectedVisualId = 'v1';
      const result = studioReducer(state, { type: 'REMOVE_VISUAL', payload: 'v1' });
      const page = result.pages.find(p => p.id === 'p1');
      expect(page?.visuals).toHaveLength(0);
      expect(result.selectedVisualId).toBeNull();
    });

    it('MOVE_VISUAL updates position', () => {
      state.pages[0].visuals = [{ id: 'v1', type: 'bar', x: 0, y: 0, width: 400, height: 300, zIndex: 1, title: 'Test', showTitle: true, buckets: {}, formatting: {}, filters: [] }];
      const result = studioReducer(state, { type: 'MOVE_VISUAL', payload: { id: 'v1', x: 200, y: 300 } });
      const visual = result.pages[0].visuals[0];
      expect(visual.x).toBe(200);
      expect(visual.y).toBe(300);
    });

    it('RESIZE_VISUAL updates dimensions', () => {
      state.pages[0].visuals = [{ id: 'v1', type: 'bar', x: 0, y: 0, width: 400, height: 300, zIndex: 1, title: 'Test', showTitle: true, buckets: {}, formatting: {}, filters: [] }];
      const result = studioReducer(state, { type: 'RESIZE_VISUAL', payload: { id: 'v1', width: 600, height: 450 } });
      const visual = result.pages[0].visuals[0];
      expect(visual.width).toBe(600);
      expect(visual.height).toBe(450);
    });

    it('SELECT_VISUAL updates selection', () => {
      const result = studioReducer(state, { type: 'SELECT_VISUAL', payload: 'v1' });
      expect(result.selectedVisualId).toBe('v1');
    });
  });

  describe('Bucket actions', () => {
    beforeEach(() => {
      state.pages = [{ id: 'p1', name: 'P1', order: 0, visuals: [] }];
      state.activePageId = 'p1';
      state.pages[0].visuals = [{
        id: 'v1', type: 'bar', x: 0, y: 0, width: 400, height: 300, zIndex: 1,
        title: 'Test', showTitle: true, buckets: {}, formatting: {}, filters: [],
      }];
    });

    it('SET_BUCKET_FIELD adds field to bucket', () => {
      const field: BucketField = { tableName: 'fato_vendas', fieldName: 'valor_total', aggregation: 'SUM' };
      const result = studioReducer(state, {
        type: 'SET_BUCKET_FIELD',
        payload: { visualId: 'v1', bucket: 'values', field },
      });
      const visual = result.pages[0].visuals[0];
      expect(visual.buckets.values).toHaveLength(1);
      expect(visual.buckets.values?.[0].fieldName).toBe('valor_total');
    });

    it('REMOVE_BUCKET_FIELD removes field at index', () => {
      state.pages[0].visuals[0].buckets.values = [
        { tableName: 'fato_vendas', fieldName: 'valor_total', aggregation: 'SUM' },
        { tableName: 'fato_vendas', fieldName: 'quantidade', aggregation: 'SUM' },
      ];
      const result = studioReducer(state, {
        type: 'REMOVE_BUCKET_FIELD',
        payload: { visualId: 'v1', bucket: 'values', index: 0 },
      });
      const visual = result.pages[0].visuals[0];
      expect(visual.buckets.values).toHaveLength(1);
      expect(visual.buckets.values?.[0].fieldName).toBe('quantidade');
    });
  });

  describe('Data Model actions', () => {
    it('SET_DATA_MODEL updates model', () => {
      const result = studioReducer(state, { type: 'SET_DATA_MODEL', payload: MOCK_DATA_MODEL });
      expect(result.dataModel).toBe(MOCK_DATA_MODEL);
      expect(result.dataModelLoading).toBe(false);
    });
  });

  describe('UI actions', () => {
    it('TOGGLE_SIDEBAR toggles sidebar', () => {
      expect(state.sidebarCollapsed).toBe(false);
      const result = studioReducer(state, { type: 'TOGGLE_SIDEBAR' });
      expect(result.sidebarCollapsed).toBe(true);
    });

    it('SET_CANVAS_ZOOM clamps zoom value', () => {
      const result = studioReducer(state, { type: 'SET_CANVAS_ZOOM', payload: 1.5 });
      expect(result.canvasZoom).toBe(1.5);
    });

    it('TOGGLE_GRID toggles grid', () => {
      expect(state.showGrid).toBe(true);
      const result = studioReducer(state, { type: 'TOGGLE_GRID' });
      expect(result.showGrid).toBe(false);
    });
  });
});
