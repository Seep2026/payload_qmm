import type { InsightOption } from '../types/qmmContent'
import type { FingerprintResultKey } from './fingerprints'

const scoreMap: Record<InsightOption, number> = {
  off: 0,
  right: 2,
  unsure: 1,
}

export const computeResultKey = (options: InsightOption[]): FingerprintResultKey => {
  if (!options.length) {
    return 'no_data'
  }

  const total = options.reduce((sum, option) => sum + scoreMap[option], 0)
  const score = total / options.length

  if (score >= 1.4) {
    return 'quiet_carrying_phase'
  }

  if (score >= 0.8) {
    return 'mixed_reflection_phase'
  }

  return 'guarded_phase'
}
