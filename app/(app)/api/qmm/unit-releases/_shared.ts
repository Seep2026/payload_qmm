import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'

type CollectionDoc = Record<string, unknown>
type ID = number | string

type PublishMode = 'current_version' | 'explicit' | 'latest_published'
type ReleaseChannel = 'h5' | 'miniapp' | 'web'
type ReleaseStatus = 'active' | 'ended' | 'paused' | 'scheduled'

export type PublishPreviewInput = {
  channel?: ReleaseChannel
  insightSetSlug?: string
  insightSetVersionId?: ID
  mode?: PublishMode
  storySlug?: string
  storyVersionId?: ID
  theme?: string
  themeId?: ID
  unitId?: ID
}

export type PublishInput = PublishPreviewInput & {
  activateAt?: string
  durationHours?: number
  idempotencyKey?: string
  note?: string
  priority?: number
  status?: ReleaseStatus
  trafficWeight?: number
}

type ResolvedUnitRelease = {
  insightSet: CollectionDoc
  insightSetVersion: CollectionDoc
  mode: PublishMode
  story: CollectionDoc
  storyVersion: CollectionDoc
  theme: CollectionDoc
  unit: CollectionDoc
  warnings: string[]
}

const THEMES_COLLECTION = 'themes'
const STORIES_COLLECTION = 'stories'
const INSIGHT_SETS_COLLECTION = 'insight-sets'
const INSIGHT_STORY_UNITS_COLLECTION = 'insight-story-units'
const STORY_VERSIONS_COLLECTION = 'story-versions'
const INSIGHT_SET_VERSIONS_COLLECTION = 'insight-set-versions'
const INSIGHT_CARDS_COLLECTION = 'insight-cards'
const UNIT_RELEASES_COLLECTION = 'unit-releases'

const DEFAULT_CHANNEL: ReleaseChannel = 'web'
const DEFAULT_MODE: PublishMode = 'latest_published'

const toRecord = (value: unknown): CollectionDoc | null =>
  value && typeof value === 'object' ? (value as CollectionDoc) : null

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const relationToID = (value: unknown): ID | null => {
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

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

const parseDate = (value: unknown): Date | null => {
  const text = normalizeText(value)
  if (!text) {
    return null
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isReleaseChannel = (value: unknown): value is ReleaseChannel =>
  value === 'web' || value === 'h5' || value === 'miniapp'

const isReleaseStatus = (value: unknown): value is ReleaseStatus =>
  value === 'scheduled' || value === 'active' || value === 'paused' || value === 'ended'

const getSlug = (doc: CollectionDoc): string => normalizeText(doc.slug)
const getName = (doc: CollectionDoc): string =>
  normalizeText(doc.name) || normalizeText(doc.title) || `#${String(doc.id ?? '')}`

const ensureDoc = (value: CollectionDoc | null, message: string): CollectionDoc => {
  if (!value) {
    throw new Error(message)
  }

  return value
}

export const parseJSONBody = async <T>(request: Request): Promise<null | T> => {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
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

export const assertOpenClawAuth = (request: Request): null | Response => {
  const requiredToken =
    process.env.QMM_OPENCLAW_API_TOKEN || process.env.QMM_OPENCLAW_TOKEN || process.env.QMM_API_TOKEN

  if (!requiredToken) {
    return null
  }

  const authorization = request.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

  if (!bearer || bearer !== requiredToken) {
    return Response.json(
      {
        error: 'Unauthorized.',
      },
      { status: 401 },
    )
  }

  return null
}

const findTheme = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  input: PublishPreviewInput,
): Promise<CollectionDoc> => {
  const themeID = relationToID(input.themeId)
  const themeRef = normalizeText(input.theme)

  if (themeID) {
    const byID = await payload.findByID({
      id: themeID,
      collection: THEMES_COLLECTION as never,
      depth: 0,
    } as never)

    return ensureDoc(toRecord(byID), `Theme "${String(themeID)}" not found.`)
  }

  if (!themeRef) {
    throw new Error('theme or themeId is required.')
  }

  const bySlug = await payload.find({
    collection: THEMES_COLLECTION as never,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: themeRef,
      },
    },
  } as never)

  const slugDoc = toRecord((bySlug as { docs?: unknown[] })?.docs?.[0])
  if (slugDoc) {
    return slugDoc
  }

  const byName = await payload.find({
    collection: THEMES_COLLECTION as never,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      name: {
        equals: themeRef,
      },
    },
  } as never)

  const nameDoc = toRecord((byName as { docs?: unknown[] })?.docs?.[0])
  return ensureDoc(nameDoc, `Theme "${themeRef}" not found.`)
}

const findStoryForTheme = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  themeID: ID,
  storySlug?: string,
): Promise<{ doc: CollectionDoc; warnings: string[] }> => {
  const warnings: string[] = []
  const normalizedStorySlug = normalizeText(storySlug)

  if (normalizedStorySlug) {
    const bySlug = await payload.find({
      collection: STORIES_COLLECTION as never,
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            theme: {
              equals: themeID,
            },
          },
          {
            slug: {
              equals: normalizedStorySlug,
            },
          },
        ],
      },
    } as never)

    const doc = toRecord((bySlug as { docs?: unknown[] })?.docs?.[0])
    if (!doc) {
      throw new Error(`Story "${normalizedStorySlug}" not found under the selected theme.`)
    }

    return { doc, warnings }
  }

  const published = await payload.find({
    collection: STORIES_COLLECTION as never,
    depth: 0,
    limit: 5,
    pagination: false,
    sort: '-publishedAt',
    where: {
      and: [
        {
          theme: {
            equals: themeID,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
      ],
    },
  } as never)

  const publishedDocs = ((published as { docs?: unknown[] })?.docs || [])
    .map(toRecord)
    .filter((item): item is CollectionDoc => Boolean(item))

  if (publishedDocs.length > 1) {
    warnings.push(
      `Multiple published stories found under theme; selected latest by publishedAt: ${getName(publishedDocs[0])}.`,
    )
  }

  if (publishedDocs.length > 0) {
    return { doc: publishedDocs[0], warnings }
  }

  const fallback = await payload.find({
    collection: STORIES_COLLECTION as never,
    depth: 0,
    limit: 1,
    pagination: false,
    sort: '-updatedAt',
    where: {
      theme: {
        equals: themeID,
      },
    },
  } as never)

  const fallbackDoc = toRecord((fallback as { docs?: unknown[] })?.docs?.[0])
  const doc = ensureDoc(fallbackDoc, 'No story found for the selected theme.')
  warnings.push(
    `No published story found; selected latest updated story "${getName(doc)}" as fallback.`,
  )
  return { doc, warnings }
}

const findInsightSetForTheme = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  themeID: ID,
  insightSetSlug?: string,
): Promise<{ doc: CollectionDoc; warnings: string[] }> => {
  const warnings: string[] = []
  const normalizedInsightSetSlug = normalizeText(insightSetSlug)

  if (normalizedInsightSetSlug) {
    const bySlug = await payload.find({
      collection: INSIGHT_SETS_COLLECTION as never,
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            theme: {
              equals: themeID,
            },
          },
          {
            slug: {
              equals: normalizedInsightSetSlug,
            },
          },
        ],
      },
    } as never)

    const doc = toRecord((bySlug as { docs?: unknown[] })?.docs?.[0])
    if (!doc) {
      throw new Error(`Insight Set "${normalizedInsightSetSlug}" not found under the selected theme.`)
    }

    return { doc, warnings }
  }

  const active = await payload.find({
    collection: INSIGHT_SETS_COLLECTION as never,
    depth: 0,
    limit: 5,
    pagination: false,
    sort: '-updatedAt',
    where: {
      and: [
        {
          theme: {
            equals: themeID,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  } as never)

  const activeDocs = ((active as { docs?: unknown[] })?.docs || [])
    .map(toRecord)
    .filter((item): item is CollectionDoc => Boolean(item))

  if (activeDocs.length > 1) {
    warnings.push(
      `Multiple active insight sets found under theme; selected latest updated: ${getName(activeDocs[0])}.`,
    )
  }

  if (activeDocs.length > 0) {
    return { doc: activeDocs[0], warnings }
  }

  const fallback = await payload.find({
    collection: INSIGHT_SETS_COLLECTION as never,
    depth: 0,
    limit: 1,
    pagination: false,
    sort: '-updatedAt',
    where: {
      theme: {
        equals: themeID,
      },
    },
  } as never)

  const fallbackDoc = toRecord((fallback as { docs?: unknown[] })?.docs?.[0])
  const doc = ensureDoc(fallbackDoc, 'No insight set found for the selected theme.')
  warnings.push(
    `No active insight set found; selected latest updated set "${getName(doc)}" as fallback.`,
  )
  return { doc, warnings }
}

const findOrBuildUnit = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    canCreate: boolean
    insightSetID: ID
    unitID?: ID | null
    storyID: ID
    themeName: string
  },
): Promise<{ created: boolean; doc: CollectionDoc }> => {
  if (args.unitID) {
    const byID = await payload.findByID({
      id: args.unitID,
      collection: INSIGHT_STORY_UNITS_COLLECTION as never,
      depth: 0,
    } as never)
    const doc = ensureDoc(toRecord(byID), `Unit "${String(args.unitID)}" not found.`)
    return { created: false, doc }
  }

  const existing = await payload.find({
    collection: INSIGHT_STORY_UNITS_COLLECTION as never,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      and: [
        {
          story: {
            equals: args.storyID,
          },
        },
        {
          insightSet: {
            equals: args.insightSetID,
          },
        },
      ],
    },
  } as never)

  const existingDoc = toRecord((existing as { docs?: unknown[] })?.docs?.[0])
  if (existingDoc) {
    return { created: false, doc: existingDoc }
  }

  if (!args.canCreate) {
    throw new Error('Unit not found for selected Story + Insight Set.')
  }

  const created = await payload.create({
    collection: INSIGHT_STORY_UNITS_COLLECTION as never,
    depth: 0,
    data: {
      story: args.storyID,
      insightSet: args.insightSetID,
      status: 'active',
      note: `Auto-created by publish API for theme "${args.themeName}"`,
    },
  } as never)

  return { created: true, doc: ensureDoc(toRecord(created), 'Failed to create unit.') }
}

const findVersionByID = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  collection: string,
  id: ID,
  label: string,
): Promise<CollectionDoc> => {
  const doc = await payload.findByID({
    id,
    collection: collection as never,
    depth: 0,
  } as never)

  return ensureDoc(toRecord(doc), `${label} "${String(id)}" not found.`)
}

const findLatestPublishedVersion = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    ownerField: 'insightSet' | 'story'
    ownerID: ID
    collection: string
    label: string
  },
): Promise<CollectionDoc> => {
  const published = await payload.find({
    collection: args.collection as never,
    depth: 0,
    limit: 20,
    pagination: false,
    sort: '-updatedAt',
    where: {
      and: [
        {
          [args.ownerField]: {
            equals: args.ownerID,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
      ],
    },
  } as never)

  const doc = toRecord((published as { docs?: unknown[] })?.docs?.[0])
  return ensureDoc(doc, `No published ${args.label} found.`)
}

const findCurrentVersion = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    relation: unknown
    collection: string
    label: string
  },
): Promise<CollectionDoc> => {
  const id = relationToID(args.relation)
  if (!id) {
    throw new Error(`No currentVersion configured for ${args.label}.`)
  }

  return await findVersionByID(payload, args.collection, id, args.label)
}

const ensureVersionMatches = (args: {
  insightSetID: ID
  insightSetVersion: CollectionDoc
  storyID: ID
  storyVersion: CollectionDoc
  unit: CollectionDoc
}): void => {
  const versionStoryID = relationToID(args.storyVersion.story)
  const versionInsightSetID = relationToID(args.insightSetVersion.insightSet)
  const unitStoryID = relationToID(args.unit.story)
  const unitInsightSetID = relationToID(args.unit.insightSet)

  if (!versionStoryID || versionStoryID !== args.storyID) {
    throw new Error('storyVersion does not belong to the selected Story.')
  }

  if (!versionInsightSetID || versionInsightSetID !== args.insightSetID) {
    throw new Error('insightSetVersion does not belong to the selected Insight Set.')
  }

  if (!unitStoryID || unitStoryID !== args.storyID) {
    throw new Error('Unit does not belong to the selected Story.')
  }

  if (!unitInsightSetID || unitInsightSetID !== args.insightSetID) {
    throw new Error('Unit does not belong to the selected Insight Set.')
  }
}

const resolveVersions = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    input: PublishPreviewInput
    insightSet: CollectionDoc
    mode: PublishMode
    story: CollectionDoc
  },
): Promise<{ insightSetVersion: CollectionDoc; storyVersion: CollectionDoc }> => {
  const storyID = relationToID(args.story.id)
  const insightSetID = relationToID(args.insightSet.id)

  if (!storyID || !insightSetID) {
    throw new Error('Story / Insight Set IDs are missing.')
  }

  if (args.mode === 'explicit') {
    const storyVersionID = relationToID(args.input.storyVersionId)
    const insightSetVersionID = relationToID(args.input.insightSetVersionId)

    if (!storyVersionID || !insightSetVersionID) {
      throw new Error('explicit mode requires storyVersionId and insightSetVersionId.')
    }

    const storyVersion = await findVersionByID(
      payload,
      STORY_VERSIONS_COLLECTION,
      storyVersionID,
      'Story Version',
    )
    const insightSetVersion = await findVersionByID(
      payload,
      INSIGHT_SET_VERSIONS_COLLECTION,
      insightSetVersionID,
      'Insight Set Version',
    )

    return { storyVersion, insightSetVersion }
  }

  if (args.mode === 'current_version') {
    const storyVersion = await findCurrentVersion(payload, {
      relation: args.story.currentVersion,
      collection: STORY_VERSIONS_COLLECTION,
      label: 'Story',
    })
    const insightSetVersion = await findCurrentVersion(payload, {
      relation: args.insightSet.currentVersion,
      collection: INSIGHT_SET_VERSIONS_COLLECTION,
      label: 'Insight Set',
    })

    return { storyVersion, insightSetVersion }
  }

  const storyVersion = await findLatestPublishedVersion(payload, {
    ownerField: 'story',
    ownerID: storyID,
    collection: STORY_VERSIONS_COLLECTION,
    label: 'story version',
  })
  const insightSetVersion = await findLatestPublishedVersion(payload, {
    ownerField: 'insightSet',
    ownerID: insightSetID,
    collection: INSIGHT_SET_VERSIONS_COLLECTION,
    label: 'insight set version',
  })

  return { storyVersion, insightSetVersion }
}

export const resolveUnitReleaseInput = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  input: PublishPreviewInput,
  options: { canCreateUnit: boolean },
): Promise<{ resolved: ResolvedUnitRelease; unitCreated: boolean }> => {
  const mode = input.mode || DEFAULT_MODE
  const warnings: string[] = []
  const theme = await findTheme(payload, input)
  const themeID = relationToID(theme.id)
  const themeName = getName(theme)

  if (!themeID) {
    throw new Error('Resolved theme ID is missing.')
  }

  const storyResult = await findStoryForTheme(payload, themeID, input.storySlug)
  const insightSetResult = await findInsightSetForTheme(payload, themeID, input.insightSetSlug)

  warnings.push(...storyResult.warnings, ...insightSetResult.warnings)

  const story = storyResult.doc
  const insightSet = insightSetResult.doc
  const storyID = relationToID(story.id)
  const insightSetID = relationToID(insightSet.id)

  if (!storyID || !insightSetID) {
    throw new Error('Resolved Story / Insight Set IDs are missing.')
  }

  const unitID = relationToID(input.unitId)
  const unitResult = await findOrBuildUnit(payload, {
    canCreate: options.canCreateUnit,
    insightSetID,
    unitID,
    storyID,
    themeName,
  })

  const versions = await resolveVersions(payload, {
    input,
    insightSet,
    mode,
    story,
  })

  ensureVersionMatches({
    insightSetID,
    insightSetVersion: versions.insightSetVersion,
    storyID,
    storyVersion: versions.storyVersion,
    unit: unitResult.doc,
  })

  const resolved: ResolvedUnitRelease = {
    insightSet,
    insightSetVersion: versions.insightSetVersion,
    mode,
    story,
    storyVersion: versions.storyVersion,
    theme,
    unit: unitResult.doc,
    warnings,
  }

  return { resolved, unitCreated: unitResult.created }
}

const isWithinWindow = (doc: CollectionDoc, at: Date): boolean => {
  const startAt = parseDate(doc.startAt)
  const endAt = parseDate(doc.endAt)

  if (startAt && startAt > at) {
    return false
  }

  if (endAt && endAt <= at) {
    return false
  }

  return true
}

export const collectReleaseConflicts = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    channel: ReleaseChannel
    unitID: ID
  },
): Promise<CollectionDoc[]> => {
  const current = await payload.find({
    collection: UNIT_RELEASES_COLLECTION as never,
    depth: 0,
    limit: 20,
    pagination: false,
    sort: '-updatedAt',
    where: {
      and: [
        {
          unit: {
            equals: args.unitID,
          },
        },
        {
          channel: {
            equals: args.channel,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  } as never)

  return ((current as { docs?: unknown[] })?.docs || [])
    .map(toRecord)
    .filter((item): item is CollectionDoc => Boolean(item))
}

export const countActiveCardsForInsightSetVersion = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  insightSetVersionID: ID,
): Promise<number> => {
  const cards = await payload.find({
    collection: INSIGHT_CARDS_COLLECTION as never,
    depth: 0,
    limit: 1,
    pagination: false,
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
  } as never)

  const totalDocs = asNumber((cards as { totalDocs?: unknown })?.totalDocs, 0)
  return totalDocs
}

export const evaluateFrontEndReadiness = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  resolved: ResolvedUnitRelease,
): Promise<{
  activeCardCount: number
  readyForFrontEnd: boolean
  reasons: string[]
}> => {
  const reasons: string[] = []

  const storyStatus = normalizeText(resolved.story.status)
  if (storyStatus !== 'published') {
    reasons.push('Story status is not published.')
  }

  const insightSetVersionID = relationToID(resolved.insightSetVersion.id)
  if (!insightSetVersionID) {
    reasons.push('Insight Set Version ID is missing.')
    return {
      activeCardCount: 0,
      readyForFrontEnd: false,
      reasons,
    }
  }

  const activeCardCount = await countActiveCardsForInsightSetVersion(payload, insightSetVersionID)
  if (activeCardCount <= 0) {
    reasons.push('No active insight cards found under selected Insight Set Version.')
  }

  return {
    activeCardCount,
    readyForFrontEnd: reasons.length === 0,
    reasons,
  }
}

export const buildSchedulePayload = (
  input: PublishInput,
  now: Date,
): {
  channel: ReleaseChannel
  endAt?: string
  startAt: string
  status: ReleaseStatus
} => {
  const channel = isReleaseChannel(input.channel) ? input.channel : DEFAULT_CHANNEL
  const activateAtText = normalizeText(input.activateAt)
  const requestedStartAt = activateAtText === 'now' ? now : parseDate(activateAtText)
  const startAt = requestedStartAt || now

  let status: ReleaseStatus
  if (isReleaseStatus(input.status)) {
    status = input.status
  } else {
    status = startAt <= now ? 'active' : 'scheduled'
  }

  const durationHours = asNumber(input.durationHours, 0)
  const endAt =
    durationHours > 0
      ? new Date(startAt.getTime() + durationHours * 60 * 60 * 1000).toISOString()
      : undefined

  return {
    channel,
    endAt,
    startAt: startAt.toISOString(),
    status,
  }
}

const getIdempotencyFromAudienceRule = (value: unknown): string => {
  const audienceRule = toRecord(value)
  const openclaw = audienceRule ? toRecord(audienceRule.openclaw) : null
  return normalizeText(openclaw?.idempotencyKey)
}

export const findExistingReleaseByIdempotency = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    channel: ReleaseChannel
    idempotencyKey: string
    unitID: ID
  },
): Promise<CollectionDoc | null> => {
  const releases = await payload.find({
    collection: UNIT_RELEASES_COLLECTION as never,
    depth: 0,
    limit: 100,
    pagination: false,
    sort: '-updatedAt',
    where: {
      and: [
        {
          unit: {
            equals: args.unitID,
          },
        },
        {
          channel: {
            equals: args.channel,
          },
        },
      ],
    },
  } as never)

  const matched = ((releases as { docs?: unknown[] })?.docs || [])
    .map(toRecord)
    .find((doc) => {
      if (!doc) {
        return false
      }

      return getIdempotencyFromAudienceRule(doc.audienceRule) === args.idempotencyKey
    })

  return matched || null
}

export const serializeResolved = (resolved: ResolvedUnitRelease) => ({
  insightSet: {
    id: relationToID(resolved.insightSet.id),
    name: getName(resolved.insightSet),
    slug: getSlug(resolved.insightSet),
    status: normalizeText(resolved.insightSet.status),
  },
  insightSetVersion: {
    displayTitle: normalizeText(resolved.insightSetVersion.displayTitle),
    id: relationToID(resolved.insightSetVersion.id),
    status: normalizeText(resolved.insightSetVersion.status),
    version: normalizeText(resolved.insightSetVersion.version),
  },
  mode: resolved.mode,
  story: {
    id: relationToID(resolved.story.id),
    slug: getSlug(resolved.story),
    status: normalizeText(resolved.story.status),
    title: getName(resolved.story),
  },
  storyVersion: {
    displayTitle: normalizeText(resolved.storyVersion.displayTitle),
    id: relationToID(resolved.storyVersion.id),
    status: normalizeText(resolved.storyVersion.status),
    version: normalizeText(resolved.storyVersion.version),
  },
  theme: {
    id: relationToID(resolved.theme.id),
    name: getName(resolved.theme),
    slug: getSlug(resolved.theme),
    status: normalizeText(resolved.theme.status),
  },
  unit: {
    displayTitle: normalizeText(resolved.unit.displayTitle),
    id: relationToID(resolved.unit.id),
    status: normalizeText(resolved.unit.status),
  },
  warnings: resolved.warnings,
})

export const buildOpenClawAudienceRule = (args: {
  channel: ReleaseChannel
  idempotencyKey?: string
  mode: PublishMode
  note?: string
  themeSlug: string
}): Record<string, unknown> => ({
  openclaw: {
    channel: args.channel,
    idempotencyKey: normalizeText(args.idempotencyKey) || undefined,
    mode: args.mode,
    note: normalizeText(args.note) || undefined,
    requestedAt: new Date().toISOString(),
    source: 'openclaw',
    theme: args.themeSlug,
  },
})

export const createUnitRelease = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    audienceRule: Record<string, unknown>
    input: PublishInput
    resolved: ResolvedUnitRelease
    schedule: {
      channel: ReleaseChannel
      endAt?: string
      startAt: string
      status: ReleaseStatus
    }
  },
): Promise<CollectionDoc> => {
  const created = await payload.create({
    collection: UNIT_RELEASES_COLLECTION as never,
    depth: 1,
    data: {
      audienceRule: args.audienceRule,
      channel: args.schedule.channel,
      endAt: args.schedule.endAt,
      insightSetVersion: relationToID(args.resolved.insightSetVersion.id),
      priority: asNumber(args.input.priority, 0),
      startAt: args.schedule.startAt,
      status: args.schedule.status,
      storyVersion: relationToID(args.resolved.storyVersion.id),
      trafficWeight: asNumber(args.input.trafficWeight, 100),
      unit: relationToID(args.resolved.unit.id),
    },
  } as never)

  return ensureDoc(toRecord(created), 'Failed to create unit release.')
}

export const resolveChannel = (value: unknown): ReleaseChannel =>
  isReleaseChannel(value) ? value : DEFAULT_CHANNEL

export const resolveMode = (value: unknown): PublishMode => {
  if (value === 'explicit' || value === 'current_version' || value === 'latest_published') {
    return value
  }

  return DEFAULT_MODE
}

export const isActiveNow = (doc: CollectionDoc, at = new Date()): boolean => {
  const status = normalizeText(doc.status)
  if (status !== 'active') {
    return false
  }

  return isWithinWindow(doc, at)
}

export const listEffectiveReleases = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    channel: ReleaseChannel
    themeID?: ID
  },
): Promise<CollectionDoc[]> => {
  const docs = await payload.find({
    collection: UNIT_RELEASES_COLLECTION as never,
    depth: 2,
    limit: 50,
    pagination: false,
    sort: '-priority',
    where: {
      and: [
        {
          channel: {
            equals: args.channel,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  } as never)

  const now = new Date()
  const releases = ((docs as { docs?: unknown[] })?.docs || [])
    .map(toRecord)
    .filter((item): item is CollectionDoc => Boolean(item))
    .filter((item) => isActiveNow(item, now))

  if (!args.themeID) {
    return releases
  }

  return releases.filter((release) => {
    const unit = toRecord(release.unit)
    const story = unit ? toRecord(unit.story) : null
    return story ? String(relationToID(story.theme)) === String(args.themeID) : false
  })
}
