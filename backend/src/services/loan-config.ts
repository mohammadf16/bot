import type { LoanConfig } from "../types.js"

export const DEFAULT_LOAN_CONFIG: LoanConfig = {
  enabled: true,
  requiredVipLevelId: 3,
  minLoanIrr: 500_000,
  maxLoanIrr: 5_000_000,
  monthlyInterestRatePercent: 1.5,
  minInstallments: 6,
  maxInstallments: 36,
  defaultInstallments: 12,
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return fallback
}

export function normalizeLoanConfig(input: Partial<LoanConfig> | undefined): LoanConfig {
  const source = input ?? {}

  const enabled = toBoolean(source.enabled, DEFAULT_LOAN_CONFIG.enabled)
  const requiredVipLevelId = Math.max(1, Math.min(5, Math.trunc(toFiniteNumber(source.requiredVipLevelId, DEFAULT_LOAN_CONFIG.requiredVipLevelId))))

  const minLoanIrrRaw = Math.max(1, Math.trunc(toFiniteNumber(source.minLoanIrr, DEFAULT_LOAN_CONFIG.minLoanIrr)))
  const maxLoanIrrRaw = Math.max(1, Math.trunc(toFiniteNumber(source.maxLoanIrr, DEFAULT_LOAN_CONFIG.maxLoanIrr)))
  const minLoanIrr = Math.min(minLoanIrrRaw, maxLoanIrrRaw)
  const maxLoanIrr = Math.max(minLoanIrrRaw, maxLoanIrrRaw)

  const monthlyInterestRatePercent = Math.max(0, Math.min(100, toFiniteNumber(source.monthlyInterestRatePercent, DEFAULT_LOAN_CONFIG.monthlyInterestRatePercent)))

  const minInstallmentsRaw = Math.max(1, Math.min(120, Math.trunc(toFiniteNumber(source.minInstallments, DEFAULT_LOAN_CONFIG.minInstallments))))
  const maxInstallmentsRaw = Math.max(1, Math.min(120, Math.trunc(toFiniteNumber(source.maxInstallments, DEFAULT_LOAN_CONFIG.maxInstallments))))
  const minInstallments = Math.min(minInstallmentsRaw, maxInstallmentsRaw)
  const maxInstallments = Math.max(minInstallmentsRaw, maxInstallmentsRaw)
  const defaultInstallments = Math.max(
    minInstallments,
    Math.min(maxInstallments, Math.trunc(toFiniteNumber(source.defaultInstallments, DEFAULT_LOAN_CONFIG.defaultInstallments))),
  )

  return {
    enabled,
    requiredVipLevelId,
    minLoanIrr,
    maxLoanIrr,
    monthlyInterestRatePercent,
    minInstallments,
    maxInstallments,
    defaultInstallments,
  }
}

export function resolveInstallments(config: LoanConfig, requested?: number): number {
  const raw = requested === undefined ? config.defaultInstallments : Math.trunc(requested)
  return Math.max(config.minInstallments, Math.min(config.maxInstallments, raw))
}

export function buildLoanPlan(config: LoanConfig, principalIrr: number, requestedInstallments?: number) {
  const installmentCount = resolveInstallments(config, requestedInstallments)
  const principal = Math.max(0, Math.trunc(principalIrr))
  const monthlyRate = config.monthlyInterestRatePercent / 100
  const totalRepayableIrr = Math.round(principal * (1 + monthlyRate * installmentCount))
  const monthlyInstallmentIrr = installmentCount > 0 ? Math.ceil(totalRepayableIrr / installmentCount) : 0

  return {
    installmentCount,
    interestRateMonthlyPercent: config.monthlyInterestRatePercent,
    totalRepayableIrr,
    monthlyInstallmentIrr,
  }
}
