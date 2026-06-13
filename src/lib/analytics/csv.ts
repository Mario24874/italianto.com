export function sanitizeCell(value: unknown): string {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(s)) s = "'" + s
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function toCSV(header: string[], rows: (string | number | null)[][]): string {
  const lines = [header.map(sanitizeCell).join(',')]
  for (const r of rows) lines.push(r.map(sanitizeCell).join(','))
  return lines.join('\n')
}
