import type { InsightOption } from '../types/qmmContent'

export const QMM_SESSION_STORAGE_KEY = 'qmm.clientSessionId'

export type StartInsightRunInput = {
  flowVersion?: string
  storySlug: string
  themeId: string
  themeName: string
  themeSentence?: string
}

export type StartInsightRunResponse = {
  id: number | string
  runId: string
  startedAt: string
}

export type SaveInsightResponseInput = {
  answeredAt: string
  cardKey: string
  latencyMs: number
  option: InsightOption
  order: number
  statement: string
}

export type CompleteInsightRunInput = {
  completedAt: string
  resultKey: string
  resultSnapshot: Record<string, unknown>
}

export type CompleteInsightRunResponse = {
  completedAt: string
  fingerprintPhrase: string
  fingerprintVersion?: string
  responseCount: number
  resultKey: string
  runId: string
  status: string
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const createSessionID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export const getOrCreateClientSessionID = (): string => {
  if (typeof window === 'undefined') {
    return 'server'
  }

  try {
    const existing = normalizeText(window.localStorage.getItem(QMM_SESSION_STORAGE_KEY))

    if (existing) {
      return existing
    }

    const next = createSessionID()
    window.localStorage.setItem(QMM_SESSION_STORAGE_KEY, next)
    return next
  } catch {
    return createSessionID()
  }
}

export const startInsightRun = async (
  input: StartInsightRunInput,
): Promise<null | StartInsightRunResponse> => {
  try {
    const response = await fetch('/api/qmm/insights/attempts/start', {
      body: JSON.stringify({
        clientSessionId: getOrCreateClientSessionID(),
        flowVersion: input.flowVersion || 'web_mvp_v1',
        storySlug: input.storySlug,
        themeId: input.themeId,
        themeName: input.themeName,
        themeSentence: input.themeSentence,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      return null
    }

    const parsed = (await response.json()) as StartInsightRunResponse
    return parsed?.runId ? parsed : null
  } catch {
    return null
  }
}

export const saveInsightResponse = async (
  runId: string,
  input: SaveInsightResponseInput,
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/qmm/insights/attempts/${runId}/response`, {
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    return response.ok
  } catch {
    return false
  }
}

export const completeInsightRun = async (
  runId: string,
  input: CompleteInsightRunInput,
): Promise<CompleteInsightRunResponse | null> => {
  try {
    const response = await fetch(`/api/qmm/insights/attempts/${runId}/complete`, {
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as CompleteInsightRunResponse
  } catch {
    return null
  }
}
