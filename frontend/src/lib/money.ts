const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

function normalizeDigits(input: string): string {
  return input
    .split("")
    .map((ch) => {
      const p = PERSIAN_DIGITS.indexOf(ch)
      if (p >= 0) return String(p)
      const a = ARABIC_DIGITS.indexOf(ch)
      if (a >= 0) return String(a)
      return ch
    })
    .join("")
}

export function formatToman(value: number): string {
  const normalized = Number.isFinite(value) ? Math.trunc(value) : 0
  return normalized.toLocaleString("fa-IR")
}

export function parseTomanInput(raw: string): number | null {
  if (!raw.trim()) return null
  const normalized = normalizeDigits(raw).toLowerCase().replace(/,/g, "").trim()
  const hasMillion = normalized.includes("million") || normalized.includes("میلیون") || /\d+(\.\d+)?\s*m\b/.test(normalized)
  const numeric = normalized.replace(/[^\d.]/g, "")
  const value = Number(numeric)
  if (!Number.isFinite(value) || value <= 0) return null

  const toman = hasMillion ? value * 1_000_000 : value
  const result = Math.trunc(toman)
  if (result <= 0) return null
  return result
}
