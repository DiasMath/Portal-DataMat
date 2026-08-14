import type { DataModel } from '../types/dashboard';
import { MOCK_DATA_MODEL } from './mocks/mock-data';

export function getDataModel(dataModel: DataModel | null): DataModel {
  return dataModel ?? MOCK_DATA_MODEL;
}
