import {
  evaluateFrontEndReadiness,
  getPayloadClient,
  listEffectiveReleases,
  resolveChannel,
  type PublishPreviewInput,
} from '../_shared'

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const parseThemeInput = (url: URL): PublishPreviewInput => {
  const theme = normalizeText(url.searchParams.get('theme'))
  const themeId = normalizeText(url.searchParams.get('themeId'))
  const channel = resolveChannel(url.searchParams.get('channel'))
  const storySlug = normalizeText(url.searchParams.get('storySlug'))
  const insightSetSlug = normalizeText(url.searchParams.get('insightSetSlug'))

  return {
    channel,
    insightSetSlug: insightSetSlug || undefined,
    storySlug: storySlug || undefined,
    theme: theme || undefined,
    themeId: themeId || undefined,
  }
}

const resolveThemeID = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  input: PublishPreviewInput,
): Promise<null | number | string> => {
  if (input.themeId) {
    return input.themeId
  }

  const themeRef = normalizeText(input.theme)
  if (!themeRef) {
    return null
  }

  const bySlug = await payload.find({
    collection: 'themes' as never,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: themeRef,
      },
    },
  } as never)

  const slugDoc = (bySlug as { docs?: Array<{ id?: number | string }> })?.docs?.[0]
  if (slugDoc?.id) {
    return slugDoc.id
  }

  const byName = await payload.find({
    collection: 'themes' as never,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      name: {
        equals: themeRef,
      },
    },
  } as never)

  const nameDoc = (byName as { docs?: Array<{ id?: number | string }> })?.docs?.[0]
  return nameDoc?.id || null
}

export const GET = async (request: Request) => {
  try {
    const payload = await getPayloadClient()
    const url = new URL(request.url)
    const input = parseThemeInput(url)
    const themeID = await resolveThemeID(payload, input)

    const releases = await listEffectiveReleases(payload, {
      channel: input.channel || 'web',
      themeID: themeID || undefined,
    })

    const docs = await Promise.all(
      releases.map(async (release) => {
        const unit = (release.unit || {}) as Record<string, unknown>
        const story = (unit.story || {}) as Record<string, unknown>
        const insightSet = (unit.insightSet || {}) as Record<string, unknown>
        const insightSetVersion = (release.insightSetVersion || {}) as Record<string, unknown>
        const storyVersion = (release.storyVersion || {}) as Record<string, unknown>

        const readiness = await evaluateFrontEndReadiness(payload, {
          insightSet,
          insightSetVersion,
          mode: 'latest_published',
          story,
          storyVersion,
          theme: { id: story.theme },
          unit,
          warnings: [],
        })

        return {
          channel: release.channel,
          checks: {
            activeCardCount: readiness.activeCardCount,
            readyForFrontEnd: readiness.readyForFrontEnd,
            reasons: readiness.reasons,
          },
          endAt: release.endAt || null,
          id: release.id,
          insightSet: {
            id: insightSet.id || null,
            name: insightSet.name || null,
            slug: insightSet.slug || null,
          },
          insightSetVersion: {
            id: insightSetVersion.id || null,
            status: insightSetVersion.status || null,
            version: insightSetVersion.version || null,
          },
          priority: release.priority,
          startAt: release.startAt || null,
          status: release.status,
          story: {
            id: story.id || null,
            slug: story.slug || null,
            status: story.status || null,
            title: story.title || null,
          },
          storyVersion: {
            id: storyVersion.id || null,
            status: storyVersion.status || null,
            version: storyVersion.version || null,
          },
          unit: {
            id: unit.id || null,
          },
        }
      }),
    )

    return Response.json({
      channel: input.channel || 'web',
      count: docs.length,
      docs,
      theme: input.theme || input.themeId || null,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to query effective releases.',
      },
      { status: 400 },
    )
  }
}
