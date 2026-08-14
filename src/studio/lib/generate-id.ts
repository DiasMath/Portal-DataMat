let counter = 0;

export function generateId(prefix = 'id'): string {
  counter++;
  return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}
