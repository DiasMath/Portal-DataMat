export type MeasureFormat = {
  format?: string;
  decimalPlaces?: number;
};

export function formatMeasureValue(
  value: unknown,
  format: string = 'general',
  decimalPlaces = 2
): string {
  const num = typeof value === 'number' ? value : Number(value);
  const isNum = !isNaN(num);

  switch (format) {
    case 'currency':
      return isNum
        ? new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(num)
        : String(value);
    case 'percent':
      return isNum
        ? new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(num)
        : String(value);
    case 'number':
      return isNum
        ? new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(num)
        : String(value);
    case 'date':
      if (value instanceof Date) return value.toLocaleDateString('pt-BR');
      if (typeof value === 'string' && value && !isNaN(Date.parse(value))) {
        return new Date(value).toLocaleDateString('pt-BR');
      }
      return String(value);
    case 'text':
      return String(value);
    case 'general':
    default:
      return isNum ? num.toLocaleString('pt-BR') : String(value);
  }
}

const AGG_PREFIXES = ['sum_', 'avg_', 'count_', 'min_', 'max_', 'count_distinct_', 'countdistinct_', 'none_'];

export function buildMeasureFormatMap(
  measures: Array<{ id: string; name: string; format?: string; decimalPlaces?: number }> | undefined
): Record<string, MeasureFormat> {
  const map: Record<string, MeasureFormat> = {};
  (measures ?? []).forEach(m => {
    const fmt = { format: m.format, decimalPlaces: m.decimalPlaces };
    map[m.id] = fmt;
    map[m.name] = fmt;
    AGG_PREFIXES.forEach(p => {
      map[`${p}${m.id}`] = fmt;
      map[`${p}${m.name}`] = fmt;
    });
  });
  return map;
}

export function formatTooltipValue(value: unknown, name: string, measureFormat?: MeasureFormat): [string, string] {
  const numValue = typeof value === 'number' ? value : Number(value);
  const formatted = measureFormat
    ? formatMeasureValue(value, measureFormat.format, measureFormat.decimalPlaces)
    : !isNaN(numValue)
      ? numValue.toLocaleString('pt-BR')
      : String(value);

  let displayName = name;
  if (name.startsWith('soma_')) displayName = name.replace('soma_', '');
  else if (name.startsWith('media_')) displayName = name.replace('media_', '');
  else if (name.startsWith('contagem_')) displayName = name.replace('contagem_', '');

  return [formatted, displayName];
}
