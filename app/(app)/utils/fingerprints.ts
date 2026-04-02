import {
  DEFAULT_FINGERPRINT_FIRST_WORDS,
  DEFAULT_FINGERPRINT_SECOND_WORDS,
} from './fingerprintLexiconDefaults'

export const RECENT_FINGERPRINTS_KEY = 'qmm.recentFingerprints'
const FIRST_FINGERPRINT_HINT_KEY = 'qmm.firstFingerprintHintPending'

export const FINGERPRINTS_UPDATED_EVENT = 'qmm:fingerprints-updated'

export type FingerprintResultKey =
  | 'guarded_phase'
  | 'mixed_reflection_phase'
  | 'quiet_carrying_phase'
  | 'no_data'

export type ReflectionFingerprintRecord = {
  createdAt: string
  fingerprintPhrase: string
  resultKey: FingerprintResultKey
  storyId?: string
  themeId: string
  themeName: string
  version: string
}

const hashString = (value: string): number => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

const isRecordLike = (value: unknown): value is ReflectionFingerprintRecord => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.themeId === 'string' &&
    typeof item.themeName === 'string' &&
    typeof item.resultKey === 'string' &&
    typeof item.fingerprintPhrase === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.version === 'string'
  )
}

export const isBrowserStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const key = '__qmm_storage_probe__'
    window.localStorage.setItem(key, 'ok')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export const readRecentFingerprints = (): ReflectionFingerprintRecord[] => {
  if (!isBrowserStorageAvailable()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(RECENT_FINGERPRINTS_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isRecordLike).slice(0, 3)
  } catch {
    return []
  }
}

type GenerateFingerprintArgs = {
  resultKey: FingerprintResultKey
  storyId?: string
  themeId: string
  themeName: string
  version?: string
}

export const generateFingerprintRecord = (
  args: GenerateFingerprintArgs,
): ReflectionFingerprintRecord => {
  const createdAt = new Date().toISOString()
  const seed = `${args.themeId}:${args.resultKey}:${createdAt}:${Math.random().toString(36).slice(2)}`
  const firstWord =
    DEFAULT_FINGERPRINT_FIRST_WORDS[hashString(seed) % DEFAULT_FINGERPRINT_FIRST_WORDS.length]
  const secondWord =
    DEFAULT_FINGERPRINT_SECOND_WORDS[
      hashString(`${seed}:echo`) % DEFAULT_FINGERPRINT_SECOND_WORDS.length
    ]

  return {
    createdAt,
    fingerprintPhrase: `${firstWord} ${secondWord}`,
    resultKey: args.resultKey,
    storyId: args.storyId,
    themeId: args.themeId,
    themeName: args.themeName,
    version: args.version || 'v1',
  }
}

type SaveRecentFingerprintResult = {
  isFirstStored: boolean
  records: ReflectionFingerprintRecord[]
}

export const saveRecentFingerprint = (
  record: ReflectionFingerprintRecord,
): SaveRecentFingerprintResult => {
  if (!isBrowserStorageAvailable()) {
    return {
      isFirstStored: false,
      records: [],
    }
  }

  try {
    const existing = readRecentFingerprints()

    const rest = existing.filter((item) => {
      return !(
        item.themeId === record.themeId &&
        item.resultKey === record.resultKey &&
        item.fingerprintPhrase === record.fingerprintPhrase
      )
    })

    const next = [record, ...rest].slice(0, 3)
    const isFirstStored = existing.length === 0

    window.localStorage.setItem(RECENT_FINGERPRINTS_KEY, JSON.stringify(next))

    if (isFirstStored) {
      window.localStorage.setItem(FIRST_FINGERPRINT_HINT_KEY, '1')
    }

    return {
      isFirstStored,
      records: next,
    }
  } catch {
    return {
      isFirstStored: false,
      records: [],
    }
  }
}

export const hasPendingFirstFingerprintHint = (): boolean => {
  if (!isBrowserStorageAvailable()) {
    return false
  }

  return window.localStorage.getItem(FIRST_FINGERPRINT_HINT_KEY) === '1'
}

export const clearFirstFingerprintHint = (): void => {
  if (!isBrowserStorageAvailable()) {
    return
  }

  window.localStorage.removeItem(FIRST_FINGERPRINT_HINT_KEY)
}

export const copyTextToClipboard = async (value: string): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }

    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const isSuccessful = document.execCommand('copy')
    document.body.removeChild(textarea)
    return isSuccessful
  } catch {
    return false
  }
}
