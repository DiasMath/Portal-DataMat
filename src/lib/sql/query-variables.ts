/**
 * Variáveis de query no estilo `:nome_da_variavel` — preenchidas num
 * pequeno formulário antes de executar, em vez de editar a query toda
 * vez que muda a data/id que você está testando.
 */

const VARIABLE_PATTERN = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;

/** Remove conteúdo de literais de string, pra não confundir ":algo" dentro de uma string com uma variável. */
function stripStringLiterals(sql: string): string {
  return sql
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

/** Lista os nomes distintos de variável usados na query, na ordem em que aparecem. */
export function extractVariables(sql: string): string[] {
  const cleaned = stripStringLiterals(sql);
  const names: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(VARIABLE_PATTERN);
  while ((match = regex.exec(cleaned)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      names.push(match[1]);
    }
  }
  return names;
}

/** Formata o valor digitado como literal SQL — número puro vira número, o resto vira string entre aspas. */
export function formatVariableValue(value: string): string {
  if (value.trim() === '') return 'NULL';
  if (/^-?\d+(\.\d+)?$/.test(value.trim())) return value.trim();
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Substitui cada `:nome` pelo valor formatado. Variáveis sem valor informado ficam como estão (não deveria acontecer se o fluxo de preenchimento rodou antes). */
export function substituteVariables(sql: string, values: Record<string, string>): string {
  return sql.replace(VARIABLE_PATTERN, (full, name: string) => {
    if (!(name in values)) return full;
    return formatVariableValue(values[name]);
  });
}
