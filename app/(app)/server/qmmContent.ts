import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'

import type { InsightExperienceUnit, StoryArticle } from '../types/qmmContent'

type GenericDoc = Record<string, unknown>

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

export const getPublishedStories = async (): Promise<StoryArticle[]> => {
  const payload = await getPayloadHMR({ config: configPromise })
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

  const payload = await getPayloadHMR({ config: configPromise })
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
  const payload = await getPayloadHMR({ config: configPromise })
  const releases = await payload.find({
    collection: 'unit-releases',
    depth: 3,
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

  console.log('[DEBUG] Found releases:', releases.docs.length)

  const now = new Date()
  const units: InsightExperienceUnit[] = []

  for (const rawDoc of releases.docs) {
    console.log('[DEBUG] Processing release:', rawDoc.id)
    const release = (rawDoc || {}) as GenericDoc
    const isActive = isReleaseActiveNow(release, now)
    console.log(
      '[DEBUG] Release',
      rawDoc.id,
      'isActiveNow:',
      isActive,
      'startAt:',
      release.startAt,
      'endAt:',
      release.endAt,
      'now:',
      now,
    )
    if (!isActive) {
      continue
    }

    const unit = toRecord(release.unit)
    const story = unit ? toRecord(unit.story) : null
    const insightSet = unit ? toRecord(unit.insightSet) : null
    const storyVersion = toRecord(release.storyVersion)
    const insightSetVersion = toRecord(release.insightSetVersion)

    if (!story || !insightSet || !insightSetVersion) {
      console.log('[DEBUG] Missing story/insightSet/insightSetVersion')
      continue
    }

    const storyStatus = asText(story.status)
    console.log('[DEBUG] Story status:', storyStatus)
    if (storyStatus !== 'published') {
      continue
    }

    const insightSetVersionID = relationToID(release.insightSetVersion)
    const storySlug = asText(story.slug)

    if (!insightSetVersionID || !storySlug) {
      continue
    }

    const cards = await payload.find({
      collection: 'insight-cards',
      depth: 0,
      limit: 200,
      sort: 'order',
      where: {
        and: [
          {
            insightSetVersion: {
              equals: insightSetVersionID,
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

    console.log(
      '[DEBUG] Found cards:',
      cards.docs.length,
      'for insightSetVersion:',
      insightSetVersionID,
    )

    const statements = cards.docs
      .map((card) => {
        const stmt = (card as GenericDoc).statement
        const text = asText(stmt)
        console.log('[DEBUG] Card statement:', JSON.stringify(stmt), '-> extracted:', text)
        return text
      })
      .filter(Boolean)

    console.log('[DEBUG] Extracted statements:', statements.length)

    if (!statements.length) {
      continue
    }

    const mappedStory = mapStoryArticle(story, storyVersion)
    if (!mappedStory) {
      continue
    }

    const themeSentence =
      asText(insightSet.proposition) ||
      asText(insightSetVersion.introSubtitle) ||
      asText(insightSetVersion.introTitle) ||
      'A quiet reflection space.'

    const releaseKey = relationToID(release.id) || relationToID(unit.id) || storySlug
    const themeID = relationToID(insightSet.id) || asText(insightSet.slug) || storySlug

    units.push({
      key: String(releaseKey),
      statements,
      story: mappedStory,
      storySlug,
      themeId: String(themeID),
      themeName: asText(insightSet.name) || asText(insightSet.slug) || 'Theme',
      themeSentence,
    })
  }

  return units
}
