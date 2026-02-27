import { isValidJalaaliDate, toGregorian, toJalaali } from "jalaali-js"

const PERSIAN_LOCALE = "fa-IR-u-ca-persian"

function pad2(v: number): string {
  return String(v).padStart(2, "0")
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
}

function safeDate(value: Date | string | number): Date {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return new Date()
  return d
}

export function formatJalaliDate(value: Date | string | number): string {
  return safeDate(value).toLocaleDateString(PERSIAN_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function formatJalaliTime(value: Date | string | number): string {
  return safeDate(value).toLocaleTimeString(PERSIAN_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatJalaliDateTime(value: Date | string | number): string {
  return safeDate(value).toLocaleString(PERSIAN_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function toJalaliDateInput(value: Date | string | number): string {
  const d = safeDate(value)
  const j = toJalaali(d)
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`
}

export function toJalaliDateTimeInput(value: Date | string | number): string {
  const d = safeDate(value)
  const j = toJalaali(d)
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function jalaliDateInputToGregorianISO(value: string): string | null {
  const normalized = normalizeDigits(value).trim().replace(/-/g, "/")
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return null

  const jy = Number(match[1])
  const jm = Number(match[2])
  const jd = Number(match[3])
  if (!isValidJalaaliDate(jy, jm, jd)) return null

  const g = toGregorian(jy, jm, jd)
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`
}

export function jalaliDateTimeInputToLocal(value: string): string | null {
  const normalized = normalizeDigits(value).trim().replace(/-/g, "/")
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/)
  if (!match) return null

  const jy = Number(match[1])
  const jm = Number(match[2])
  const jd = Number(match[3])
  const hh = Number(match[4])
  const mm = Number(match[5])

  if (!isValidJalaaliDate(jy, jm, jd)) return null
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null

  const g = toGregorian(jy, jm, jd)
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}T${pad2(hh)}:${pad2(mm)}`
}
