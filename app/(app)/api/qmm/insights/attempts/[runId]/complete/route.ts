import {
  findRunByRunID,
  getPayloadClient,
  INSIGHT_RUNS_COLLECTION,
  normalizeFingerprintKey,
  parseJSONBody,
} from '../../../_shared'
import { generateFingerprintFromActiveLexicon } from '../../../_fingerprintLexicon'

type CompleteRunBody = {
  completedAt?: string
  resultKey?: string
  resultSnapshot?: Record<string, unknown>
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const getParamRunID = async (context: {
  params: Promise<{ runId: string }> | { runId: string }
}): Promise<string> => {
  const params = await Promise.resolve(context.params)
  return normalizeText(params.runId)
}

export const POST = async (
  request: Request,
  context: { params: Promise<{ runId: string }> | { runId: string } },
) => {
  const runId = await getParamRunID(context)

  if (!runId) {
    return Response.json({ error: 'runId is required.' }, { status: 400 })
  }

  const body = await parseJSONBody<CompleteRunBody>(request)

  if (!body) {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const resultKey = normalizeText(body.resultKey)
  if (!resultKey) {
    return Response.json(
      {
        error: 'resultKey is required.',
      },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const run = await findRunByRunID(payload, runId)

  if (!run) {
    return Response.json({ error: 'Run not found.' }, { status: 404 })
  }

  const completedAt = normalizeText(body.completedAt) || new Date().toISOString()
  const generated = await generateFingerprintFromActiveLexicon({
    payload,
    resultKey,
    runId,
    themeId: normalizeText(run.themeId) || 'unknown_theme',
  })
  const fingerprintKey = normalizeFingerprintKey(generated.fingerprintPhrase)

  const updated = await payload.update({
    id: run.id,
    collection: INSIGHT_RUNS_COLLECTION as never,
    data: {
      completedAt,
      fingerprintKey,
      fingerprintPhrase: generated.fingerprintPhrase,
      fingerprintVersion: generated.fingerprintVersion,
      resultKey,
      resultSnapshot: body.resultSnapshot || undefined,
      status: 'completed',
    },
    depth: 0,
  } as never)

  return Response.json({
    completedAt,
    fingerprintPhrase: updated.fingerprintPhrase,
    fingerprintVersion: updated.fingerprintVersion,
    responseCount: updated.responseCount || 0,
    resultKey: updated.resultKey,
    runId,
    status: updated.status,
  })
}
