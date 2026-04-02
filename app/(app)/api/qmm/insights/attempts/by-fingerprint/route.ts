import { getPayloadClient, INSIGHT_RUNS_COLLECTION, normalizeFingerprintKey } from '../../_shared'

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const rawFingerprint = normalizeText(searchParams.get('value') || searchParams.get('fingerprint'))
  const fingerprintKey = normalizeFingerprintKey(rawFingerprint)

  if (!fingerprintKey) {
    return Response.json(
      {
        error: 'Query param value is required, e.g. ?value=quiet%20shore',
      },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: INSIGHT_RUNS_COLLECTION as never,
    depth: 0,
    limit: 20,
    sort: '-createdAt',
    where: {
      fingerprintKey: {
        equals: fingerprintKey,
      },
    },
  } as never)

  const docs = (result.docs || []) as Array<Record<string, unknown>>

  return Response.json({
    docs: docs.map((doc) => ({
      completedAt: doc.completedAt || null,
      createdAt: doc.createdAt || null,
      fingerprintPhrase: doc.fingerprintPhrase || null,
      fingerprintVersion: doc.fingerprintVersion || null,
      responseCount: doc.responseCount || 0,
      responses: doc.responses || [],
      resultKey: doc.resultKey || null,
      runId: doc.runId || null,
      sessionId: doc.clientSessionId || null,
      storySlug: doc.storySlug || null,
      themeId: doc.themeId || null,
      themeName: doc.themeName || null,
    })),
    fingerprint: rawFingerprint,
    total: docs.length,
  })
}
