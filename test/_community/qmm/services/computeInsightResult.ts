const scoreMap: Record<string, number> = {
  // New option keys
  off: 0,
  unsure: 1,
  right: 2,
  // Backward compatibility for historical data before option rename
  not_like_me: 0,
  not_sure: 1,
  very_like_me: 2,
}

type ComputeInsightResultArgs = {
  options: string[]
}

export const computeInsightResult = (
  args: ComputeInsightResultArgs,
): {
  resultKey: string
  score: number
} => {
  if (!args.options.length) {
    return {
      resultKey: 'no_data',
      score: 0,
    }
  }

  const total = args.options.reduce((sum, option) => sum + (scoreMap[option] || 0), 0)
  const score = total / args.options.length

  if (score >= 1.4) {
    return {
      resultKey: 'quiet_carrying_phase',
      score,
    }
  }

  if (score >= 0.8) {
    return {
      resultKey: 'mixed_reflection_phase',
      score,
    }
  }

  return {
    resultKey: 'guarded_phase',
    score,
  }
}
