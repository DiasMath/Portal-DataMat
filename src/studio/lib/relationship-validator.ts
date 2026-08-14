import type { DataModel, Relationship, TableSchema, FieldSchema } from '../types/dashboard';

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  type: 'type_mismatch' | 'naming_convention' | 'cardinality_suspicious' | 'low_selectivity' | 'no_index';
  message: string;
  field?: string;
  table?: string;
}

export interface ValidationError {
  type: 'incompatible_types' | 'self_reference' | 'missing_field' | 'duplicate_relationship';
  message: string;
  field?: string;
  table?: string;
}

const TYPE_COMPATIBILITY: Record<string, string[]> = {
  number: ['number', 'integer', 'decimal', 'float', 'bigint', 'int', 'tinyint', 'smallint', 'mediumint', 'double', 'real'],
  text: ['text', 'varchar', 'char', 'string', 'nvarchar', 'nchar', 'clob', 'longtext', 'mediumtext'],
  date: ['date', 'datetime', 'timestamp', 'time', 'year'],
  boolean: ['boolean', 'bit', 'tinyint(1)'],
};

export function validateRelationship(
  rel: Relationship,
  dataModel: DataModel
): ValidationResult {
  const result: ValidationResult = { isValid: true, warnings: [], errors: [] };

  const fromTable = dataModel.tables.find(t => t.name === rel.fromTable);
  const toTable = dataModel.tables.find(t => t.name === rel.toTable);

  if (!fromTable) {
    result.errors.push({
      type: 'missing_field',
      message: `Tabela de origem "${rel.fromTable}" não encontrada`,
      table: rel.fromTable,
    });
  }

  if (!toTable) {
    result.errors.push({
      type: 'missing_field',
      message: `Tabela de destino "${rel.toTable}" não encontrada`,
      table: rel.toTable,
    });
  }

  if (!fromTable || !toTable) {
    result.isValid = false;
    return result;
  }

  // Self reference check
  if (rel.fromTable === rel.toTable) {
    result.errors.push({
      type: 'self_reference',
      message: `Relacionamento automorfo: "${rel.fromTable}" referencia a si mesma`,
      table: rel.fromTable,
    });
  }

  const fromField = fromTable.fields.find(f => f.name === rel.fromField);
  const toField = toTable.fields.find(f => f.name === rel.toField);

  if (!fromField) {
    result.errors.push({
      type: 'missing_field',
      message: `Campo "${rel.fromField}" não encontrado na tabela "${rel.fromTable}"`,
      field: rel.fromField,
      table: rel.fromTable,
    });
  }

  if (!toField) {
    result.errors.push({
      type: 'missing_field',
      message: `Campo "${rel.toField}" não encontrado na tabela "${rel.toTable}"`,
      field: rel.toField,
      table: rel.toTable,
    });
  }

  if (!fromField || !toField) {
    result.isValid = false;
    return result;
  }

  // Type compatibility check
  if (!areTypesCompatible(fromField.type, toField.type)) {
    result.errors.push({
      type: 'incompatible_types',
      message: `Tipos incompatíveis: "${rel.fromField}" (${fromField.type}) não pode se ligar a "${rel.toField}" (${toField.type})`,
      field: rel.fromField,
    });
  }

  // Naming convention check
  if (!followsNamingConvention(rel.fromField, rel.toField)) {
    result.warnings.push({
      type: 'naming_convention',
      message: `Nomes das "${rel.fromField}" e "${rel.toField}" não seguem convenção de chaves`,
      field: `${rel.fromField} → ${rel.toField}`,
    });
  }

  // Suspicious cardinality check
  if (rel.cardinality === '1:1') {
    result.warnings.push({
      type: 'cardinality_suspicious',
      message: `Cardinalidade 1:1 é rara — verifique se é intencional`,
      field: `${rel.fromField} → ${rel.toField}`,
    });
  }

  // Duplicate relationship check
  const duplicates = dataModel.relationships.filter(
    r => r.id !== rel.id &&
         r.fromTable === rel.fromTable &&
         r.fromField === rel.fromField &&
         r.toTable === rel.toTable &&
         r.toField === rel.toField
  );

  if (duplicates.length > 0) {
    result.errors.push({
      type: 'duplicate_relationship',
      message: `Relacionamento duplicado: "${rel.fromField}" → "${rel.toField}"`,
      field: rel.fromField,
    });
  }

  result.isValid = result.errors.length === 0;
  return result;
}

function areTypesCompatible(fromType: string, toType: string): boolean {
  const fromLower = fromType.toLowerCase();
  const toLower = toType.toLowerCase();

  for (const [, compatibleTypes] of Object.entries(TYPE_COMPATIBILITY)) {
    const fromMatch = compatibleTypes.some(t => fromLower.includes(t));
    const toMatch = compatibleTypes.some(t => toLower.includes(t));
    if (fromMatch && toMatch) return true;
  }

  return false;
}

function followsNamingConvention(fromFieldName: string, toFieldName: string): boolean {
  const name = fromFieldName.toLowerCase();
  const target = toFieldName.toLowerCase();

  // Check if names are similar (e.g., both start with same prefix)
  const prefixes = ['id_', 'key_', 'fk_', 'pk_'];
  const fromHasPrefix = prefixes.some(p => name.startsWith(p));
  const toHasPrefix = prefixes.some(p => target.startsWith(p));

  // If one has a prefix and the other doesn't, it's suspicious
  if (fromHasPrefix !== toHasPrefix) return false;

  // Check if the core names are similar (e.g., "id_cliente" matches "id_cliente")
  if (fromHasPrefix && toHasPrefix) {
    return name === target;
  }

  return true;
}

export function validateAllRelationships(dataModel: DataModel): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (const rel of dataModel.relationships) {
    results.set(rel.id, validateRelationship(rel, dataModel));
  }

  return results;
}

export function getSuggestions(dataModel: DataModel, tableName: string, fieldName: string): Relationship[] {
  const suggestions: Relationship[] = [];
  const table = dataModel.tables.find(t => t.name === tableName);
  const field = table?.fields.find(f => f.name === fieldName);

  if (!table || !field) return suggestions;

  // Find fields in other tables with the same name
  for (const otherTable of dataModel.tables) {
    if (otherTable.name === tableName) continue;

    for (const otherField of otherTable.fields) {
      if (otherField.name === field.name) {
        // Same name — likely a foreign key relationship
        suggestions.push({
          id: `suggested-${tableName}-${fieldName}-${otherTable.name}-${otherField.name}`,
          fromTable: tableName,
          fromField: fieldName,
          toTable: otherTable.name,
          toField: otherField.name,
          cardinality: 'N:1',
          active: true,
        });
      }
    }
  }

  return suggestions;
}
