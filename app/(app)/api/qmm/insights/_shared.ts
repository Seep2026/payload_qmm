import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'

export const INSIGHT_RUNS_COLLECTION = 'insight-runs'
export const FINGERPRINT_LEXICON_COLLECTION = 'fingerprint-lexicon-releases'
export const FINGERPRINT_VERSION = 'mvp_v1'

export type InsightOptionValue = 'off' | 'right' | 'unsure'

export type InsightRunResponseItem = {
  answeredAt: string
  cardKey?: string
  latencyMs?: number
  option: InsightOptionValue
  order: number
  statement?: string
}

export type InsightRunDoc = {
  completedAt?: null | string
  fingerprintVersion?: null | string
  fingerprintKey?: null | string
  fingerprintPhrase?: null | string
  id: number | string
  responseCount?: null | number
  responses?: InsightRunResponseItem[]
  resultKey?: null | string
  runId: string
  storySlug?: null | string
  status?: null | string
  themeId?: null | string
  themeName?: null | string
}

const allowedOptions: Set<InsightOptionValue> = new Set(['off', 'unsure', 'right'])

export const isInsightOptionValue = (value: unknown): value is InsightOptionValue =>
  typeof value === 'string' && allowedOptions.has(value as InsightOptionValue)

export const normalizeFingerprintKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ')

export const parseJSONBody = async <T>(request: Request): Promise<null | T> => {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export const createRunID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

let payloadClientPromise: null | Promise<Awaited<ReturnType<typeof getPayloadHMR>>> = null

export const getPayloadClient = async () => {
  if (!payloadClientPromise) {
    payloadClientPromise = getPayloadHMR({ config }).catch((error) => {
      payloadClientPromise = null
      throw error
    })
  }

  return await payloadClientPromise
}

export const findRunByRunID = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  runId: string,
): Promise<InsightRunDoc | null> => {
  const result = await payload.find({
    collection: INSIGHT_RUNS_COLLECTION as never,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      runId: {
        equals: runId,
      },
    },
  } as never)

  const doc = (result as { docs?: unknown[] })?.docs?.[0]

  if (!doc || typeof doc !== 'object') {
    return null
  }

  return doc as InsightRunDoc
}
