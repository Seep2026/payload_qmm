import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'

import type { InsightExperienceUnit, StoryArticle } from '../types/qmmContent'

type GenericDoc = Record<string, unknown>
type RelationID = number | string
type ReleaseCandidate = {
  insightSet: GenericDoc
  insightSetVersion: GenericDoc
  insightSetVersionID: RelationID
  release: GenericDoc
  story: GenericDoc
  storySlug: string
  storyVersion: GenericDoc | null
  unit: GenericDoc
}

const toRecord = (value: unknown): GenericDoc | null =>
  value && typeof value === 'object' ? (value as GenericDoc) : null

const asDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const asText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim()
  }

  // Handle localized fields: { en: "text", zh: "文本" }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    // Try common locale keys first, then any string value
    const localeOrder = ['en', 'en-US', 'zh', 'zh-CN', 'default']
    for (const locale of localeOrder) {
      if (obj[locale] && typeof obj[locale] === 'string') {
        return (obj[locale] as string).trim()
      }
    }
    // Fallback: find first string value
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        return (obj[key] as string).trim()
      }
    }
  }

  return ''
}

const relationToID = (value: unknown): null | number | string => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  const relation = toRecord(value)
  if (!relation) {
    return null
  }

  const candidate = relation.id
  return typeof candidate === 'number' || typeof candidate === 'string' ? candidate : null
}

const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const formatDate = (value: unknown): string => {
  const parsed = asDate(value)
  if (!parsed) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

const extractLexicalText = (node: unknown): string => {
  const record = toRecord(node)
  if (!record) {
    return ''
  }

  const directText = asText(record.text)
  const children = Array.isArray(record.children) ? record.children : []
  const nested = children.map(extractLexicalText).filter(Boolean).join(' ')

  return [directText, nested].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

const mapContentBlocksToParagraphs = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const paragraphs: string[] = []

  for (const block of value) {
    const record = toRecord(block)
    if (!record) {
      continue
    }

    const blockType = asText(record.blockType)

    if (blockType === 'quoteBlock') {
      const quote = asText(record.quote)
      if (quote) {
        paragraphs.push(quote)
      }
      continue
    }

    if (blockType === 'richTextBlock') {
      const content = toRecord(record.content)
      const root = content ? toRecord(content.root) : null
      const text = root ? extractLexicalText(root).trim() : ''
      if (text) {
        paragraphs.push(text)
      }
      continue
    }

    if (blockType === 'imageBlock') {
      const caption = asText(record.caption)
      if (caption) {
        paragraphs.push(caption)
      }
      continue
    }

    if (blockType === 'videoBlock') {
      const caption = asText(record.caption)
      const url = asText(record.videoURL)
      if (caption) {
        paragraphs.push(caption)
      } else if (url) {
        paragraphs.push(url)
      }
    }
  }

  return paragraphs
}

const mapTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const relation = toRecord(item)
      return relation ? asText(relation.name) : ''
    })
    .filter(Boolean)
}

const mapStoryArticle = (
  storyDoc: GenericDoc,
  preferredVersion?: GenericDoc | null,
): null | StoryArticle => {
  const slug = asText(storyDoc.slug)
  if (!slug) {
    return null
  }

  const storyTitle = asText(storyDoc.title)
  const summary = asText(storyDoc.summary)
  const publishedAt = storyDoc.publishedAt || storyDoc.updatedAt || storyDoc.createdAt
  const date = formatDate(publishedAt)
  const tags = mapTags(storyDoc.tags)
  const currentVersion = preferredVersion || toRecord(storyDoc.currentVersion)

  const versionTitle = currentVersion ? asText(currentVersion.title) : ''
  const versionSubtitle = currentVersion ? asText(currentVersion.subtitle) : ''
  const content = currentVersion ? mapContentBlocksToParagraphs(currentVersion.contentBlocks) : []
  const excerpt = summary || content[0] || ''

  return {
    content,
    date,
    excerpt,
    slug,
    subtitle: versionSubtitle || summary || '',
    tags,
    title: versionTitle || storyTitle || slug,
  }
}

const isReleaseActiveNow = (releaseDoc: GenericDoc, now: Date): boolean => {
  const startAt = asDate(releaseDoc.startAt)
  const endAt = asDate(releaseDoc.endAt)

  if (startAt && startAt > now) {
    return false
  }

  if (endAt && endAt <= now) {
    return false
  }

  return true
}

let payloadClientPromise: null | Promise<Awaited<ReturnType<typeof getPayloadHMR>>> = null

const getPayloadClient = async () => {
  if (!payloadClientPromise) {
    payloadClientPromise = getPayloadHMR({ config: configPromise }).catch((error) => {
      payloadClientPromise = null
      throw error
    })
  }

  return await payloadClientPromise
}

export const getPublishedStories = async (): Promise<StoryArticle[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'stories',
    depth: 2,
    limit: 100,
    sort: '-updatedAt',
    where: {
      status: {
        equals: 'published',
      },
    },
  })

  return result.docs
    .map((doc) => mapStoryArticle((doc || {}) as GenericDoc))
    .filter((doc): doc is StoryArticle => Boolean(doc))
}

export const getPublishedStoryBySlug = async (slug: string): Promise<null | StoryArticle> => {
  const normalizedSlug = asText(slug)
  if (!normalizedSlug) {
    return null
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'stories',
    depth: 2,
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: normalizedSlug,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  const firstDoc = (result.docs?.[0] || null) as GenericDoc | null
  if (!firstDoc) {
    return null
  }

  return mapStoryArticle(firstDoc)
}

export const getActiveInsightExperienceUnits = async (): Promise<InsightExperienceUnit[]> => {
  const payload = await getPayloadClient()
  const releases = await payload.find({
    collection: 'unit-releases',
    depth: 2,
    limit: 50,
    sort: '-priority',
    where: {
      and: [
        {
          status: {
            equals: 'active',
          },
        },
        {
          channel: {
            equals: 'web',
          },
        },
      ],
    },
  })

  const now = new Date()
  const releaseCandidates: ReleaseCandidate[] = []

  for (const rawDoc of releases.docs) {
    const release = (rawDoc || {}) as GenericDoc
    if (!isReleaseActiveNow(release, now)) {
      continue
    }

    const unit = toRecord(release.unit)
    const story = unit ? toRecord(unit.story) : null
    const insightSet = unit ? toRecord(unit.insightSet) : null
    const storyVersion = toRecord(release.storyVersion)
    const insightSetVersion = toRecord(release.insightSetVersion)

    if (!story || !insightSet || !insightSetVersion) {
      continue
    }

    if (asText(story.status) !== 'published') {
      continue
    }

    const insightSetVersionID = relationToID(release.insightSetVersion)
    const storySlug = asText(story.slug)

    if (!insightSetVersionID || !storySlug) {
      continue
    }

    releaseCandidates.push({
      insightSet,
      insightSetVersion,
      insightSetVersionID,
      release,
      story,
      storySlug,
      storyVersion,
      unit,
    })
  }

  if (!releaseCandidates.length) {
    return []
  }

  const versionIDByKey = new Map<string, RelationID>()
  for (const candidate of releaseCandidates) {
    versionIDByKey.set(String(candidate.insightSetVersionID), candidate.insightSetVersionID)
  }

  const cards = await payload.find({
    collection: 'insight-cards',
    depth: 0,
    limit: 1000,
    sort: 'order',
    where: {
      and: [
        {
          insightSetVersion: {
            in: Array.from(versionIDByKey.values()),
          },
        },
        {
          isActive: {
            equals: true,
          },
        },
      ],
    },
  })

  const statementsByVersion = new Map<string, string[]>()
  const groupedRows = new Map<string, Array<{ order: number; text: string }>>()

  for (const rawCard of cards.docs) {
    const card = (rawCard || {}) as GenericDoc
    const versionID = relationToID(card.insightSetVersion)
    if (!versionID) {
      continue
    }

    const text = asText(card.statement)
    if (!text) {
      continue
    }

    const key = String(versionID)
    const rows = groupedRows.get(key) || []
    rows.push({
      order: asNumber(card.order),
      text,
    })
    groupedRows.set(key, rows)
  }

  for (const [key, rows] of groupedRows.entries()) {
    const statements = rows
      .sort((a, b) => a.order - b.order)
      .map((row) => row.text)
      .filter(Boolean)

    statementsByVersion.set(key, statements)
  }

  const units: InsightExperienceUnit[] = []

  for (const candidate of releaseCandidates) {
    const statements = statementsByVersion.get(String(candidate.insightSetVersionID)) || []
    if (!statements.length) {
      continue
    }

    const mappedStory = mapStoryArticle(candidate.story, candidate.storyVersion)
    if (!mappedStory) {
      continue
    }

    const themeSentence =
      asText(candidate.insightSet.proposition) ||
      asText(candidate.insightSetVersion.introSubtitle) ||
      asText(candidate.insightSetVersion.introTitle) ||
      'A quiet reflection space.'

    const releaseKey = relationToID(candidate.release.id) || relationToID(candidate.unit.id)
    const themeID =
      relationToID(candidate.insightSet.id) ||
      asText(candidate.insightSet.slug) ||
      candidate.storySlug

    units.push({
      key: String(releaseKey || candidate.storySlug),
      statements,
      story: mappedStory,
      storySlug: candidate.storySlug,
      themeId: String(themeID),
      themeName: asText(candidate.insightSet.name) || asText(candidate.insightSet.slug) || 'Theme',
      themeSentence,
    })
  }

  return units
}
