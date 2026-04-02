import {
  createRunID,
  FINGERPRINT_VERSION,
  getPayloadClient,
  INSIGHT_RUNS_COLLECTION,
  parseJSONBody,
} from '../../_shared'

type StartInsightRunBody = {
  clientSessionId?: string
  flowVersion?: string
  storySlug?: string
  themeId?: string
  themeName?: string
  themeSentence?: string
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

export const POST = async (request: Request) => {
  const body = await parseJSONBody<StartInsightRunBody>(request)

  if (!body) {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const clientSessionId = normalizeText(body.clientSessionId)
  const themeId = normalizeText(body.themeId)
  const themeName = normalizeText(body.themeName)

  if (!clientSessionId || !themeId || !themeName) {
    return Response.json(
      {
        error: 'clientSessionId, themeId, and themeName are required.',
      },
      { status: 400 },
    )
  }

  const runId = createRunID()
  const now = new Date().toISOString()
  const payload = await getPayloadClient()

  const created = await payload.create({
    collection: INSIGHT_RUNS_COLLECTION as never,
    data: {
      clientSessionId,
      flowVersion: normalizeText(body.flowVersion) || FINGERPRINT_VERSION,
      runId,
      startedAt: now,
      status: 'in_progress',
      storySlug: normalizeText(body.storySlug) || undefined,
      themeId,
      themeName,
      themeSentence: normalizeText(body.themeSentence) || undefined,
    },
    depth: 0,
  } as never)

  return Response.json(
    {
      createdAt: created.createdAt,
      id: created.id,
      runId,
      startedAt: now,
    },
    { status: 201 },
  )
}
