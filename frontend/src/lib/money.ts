function normalizeDigits(input: string): string {
  return input
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
}

function onlyDigits(input: string): string {
  return normalizeDigits(input).replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "")
}

export function formatToman(value: number): string {
  const normalized = Number.isFinite(value) ? Math.trunc(value) : 0
  return normalized.toLocaleString("fa-IR")
}

export function formatMoneyInput(raw: string): string {
  const digits = onlyDigits(raw)
  if (!digits) return ""
  return Number(digits).toLocaleString("fa-IR")
}

export function parseIntegerInput(raw: string): number | null {
  if (!raw.trim()) return null
  const digits = onlyDigits(raw)
  if (!digits) return null
  const value = Number(digits)
  if (!Number.isFinite(value)) return null
  return Math.trunc(value)
}

export function parseBoundedIntInput(raw: string, options: { min?: number; max?: number } = {}): number | null {
  const parsed = parseIntegerInput(raw)
  if (parsed === null) return null

  const min = Number.isFinite(options.min) ? Math.trunc(options.min as number) : 0
  const max = Number.isFinite(options.max) ? Math.trunc(options.max as number) : Number.MAX_SAFE_INTEGER
  const normalizedMin = Math.max(0, min)
  const normalizedMax = Math.max(normalizedMin, max)
  return Math.max(normalizedMin, Math.min(normalizedMax, parsed))
}

export function parseTomanInput(raw: string): number | null {
  if (!raw.trim()) return null

  const normalized = normalizeDigits(raw).toLowerCase().replace(/,/g, "").trim()
  const hasMillion =
    normalized.includes("million") ||
    normalized.includes("\u0645\u06CC\u0644\u06CC\u0648\u0646") ||
    /\d+(\.\d+)?\s*m\b/.test(normalized)

  const numeric = normalized.replace(/[^\d.]/g, "")
  const value = Number(numeric)
  if (!Number.isFinite(value) || value <= 0) return null

  const toman = hasMillion ? value * 1_000_000 : value
  const result = Math.trunc(toman)
  if (result <= 0) return null
  return result
}
