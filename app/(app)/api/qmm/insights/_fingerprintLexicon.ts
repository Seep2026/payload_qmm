import {
  DEFAULT_FINGERPRINT_FIRST_WORDS,
  DEFAULT_FINGERPRINT_SECOND_WORDS,
} from '../../../utils/fingerprintLexiconDefaults'
import type { Payload } from 'payload'
import { FINGERPRINT_LEXICON_COLLECTION } from './_shared'

type PayloadClient = Payload

type LexiconWord = {
  enabled?: boolean
  weight?: number
  word?: string
}

type BannedPair = {
  firstWord?: string
  secondWord?: string
}

type LexiconDoc = {
  bannedPairs?: BannedPair[]
  firstWords?: LexiconWord[]
  secondWords?: LexiconWord[]
  version?: string
}

type CandidateWord = {
  weight: number
  word: string
}

type GenerateFromLexiconArgs = {
  payload: PayloadClient
  resultKey: string
  runId: string
  themeId: string
}

export type GeneratedFingerprint = {
  fingerprintPhrase: string
  fingerprintVersion: string
}

const normalizeWord = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

const toCandidateWords = (
  items: LexiconWord[] | undefined,
  fallback: readonly string[],
): CandidateWord[] => {
  const next = (items || [])
    .map((item) => {
      const word = normalizeWord(item.word)
      const weight = Number.isFinite(item.weight) ? Number(item.weight) : 1
      const safeWeight = weight >= 1 ? Math.floor(weight) : 1

      if (!word || item.enabled === false) {
        return null
      }

      return {
        weight: safeWeight,
        word,
      }
    })
    .filter((item): item is CandidateWord => Boolean(item))

  if (next.length) {
    return next
  }

  return fallback.map((word) => ({
    weight: 1,
    word,
  }))
}

const hashString = (value: string): number => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

const toRatio = (value: number): number => {
  return (value % 10000) / 10000
}

const pickWeighted = (items: CandidateWord[], ratio: number): string => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  const target = ratio * totalWeight
  let runningWeight = 0

  for (const item of items) {
    runningWeight += item.weight

    if (target <= runningWeight) {
      return item.word
    }
  }

  return items[items.length - 1]?.word || ''
}

const toBannedSet = (pairs: BannedPair[] | undefined): Set<string> => {
  return new Set(
    (pairs || [])
      .map((pair) => `${normalizeWord(pair.firstWord)}::${normalizeWord(pair.secondWord)}`)
      .filter((value) => value !== '::'),
  )
}

const findActiveLexicon = async (payload: PayloadClient): Promise<LexiconDoc | null> => {
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: FINGERPRINT_LEXICON_COLLECTION as never,
    depth: 0,
    limit: 10,
    sort: '-updatedAt',
    where: {
      and: [
        {
          status: {
            equals: 'active',
          },
        },
        {
          or: [
            {
              activeFrom: {
                exists: false,
              },
            },
            {
              activeFrom: {
                less_than_equal: now,
              },
            },
          ],
        },
        {
          or: [
            {
              activeTo: {
                exists: false,
              },
            },
            {
              activeTo: {
                greater_than_equal: now,
              },
            },
          ],
        },
      ],
    },
  } as never)

  const doc = (result as { docs?: unknown[] })?.docs?.[0]

  if (!doc || typeof doc !== 'object') {
    return null
  }

  return doc as LexiconDoc
}

export const generateFingerprintFromActiveLexicon = async (
  args: GenerateFromLexiconArgs,
): Promise<GeneratedFingerprint> => {
  const lexicon = await findActiveLexicon(args.payload)

  const firstWords = toCandidateWords(lexicon?.firstWords, DEFAULT_FINGERPRINT_FIRST_WORDS)
  const secondWords = toCandidateWords(lexicon?.secondWords, DEFAULT_FINGERPRINT_SECOND_WORDS)
  const bannedSet = toBannedSet(lexicon?.bannedPairs)
  const version = normalizeWord(lexicon?.version) || 'fp_fallback_v1'

  const baseSeed = `${args.themeId}:${args.resultKey}:${args.runId}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2, 10)}`

  const firstWord = pickWeighted(firstWords, toRatio(hashString(`${baseSeed}:first`)))

  let secondWord = pickWeighted(secondWords, toRatio(hashString(`${baseSeed}:second`)))
  let attempt = 0

  while (attempt < 8 && bannedSet.has(`${firstWord}::${secondWord}`)) {
    secondWord = pickWeighted(secondWords, toRatio(hashString(`${baseSeed}:second:${attempt}`)))
    attempt += 1
  }

  return {
    fingerprintPhrase: `${firstWord} ${secondWord}`.trim(),
    fingerprintVersion: version,
  }
}
