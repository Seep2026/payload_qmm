import {
  findRunByRunID,
  getPayloadClient,
  INSIGHT_RUNS_COLLECTION,
  isInsightOptionValue,
  parseJSONBody,
  type InsightRunResponseItem,
} from '../../../_shared'

type SaveResponseBody = {
  answeredAt?: string
  cardKey?: string
  latencyMs?: number
  option?: string
  order?: number
  statement?: string
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const getParamRunID = async (context: {
  params: Promise<{ runId: string }> | { runId: string }
}): Promise<string> => {
  const params = await Promise.resolve(context.params)
  return normalizeText(params.runId)
}

const normalizeResponses = (value: unknown): InsightRunResponseItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is InsightRunResponseItem => {
      if (!item || typeof item !== 'object') {
        return false
      }

      const record = item as Record<string, unknown>

      return (
        typeof record.order === 'number' &&
        typeof record.answeredAt === 'string' &&
        isInsightOptionValue(record.option)
      )
    })
    .sort((a, b) => a.order - b.order)
}

export const POST = async (
  request: Request,
  context: { params: Promise<{ runId: string }> | { runId: string } },
) => {
  const runId = await getParamRunID(context)

  if (!runId) {
    return Response.json({ error: 'runId is required.' }, { status: 400 })
  }

  const body = await parseJSONBody<SaveResponseBody>(request)

  if (!body) {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const order = Number(body.order)
  const option = normalizeText(body.option)

  if (!Number.isInteger(order) || order < 1 || !isInsightOptionValue(option)) {
    return Response.json(
      {
        error: 'order must be an integer >= 1, option must be one of off/unsure/right.',
      },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const run = await findRunByRunID(payload, runId)

  if (!run) {
    return Response.json({ error: 'Run not found.' }, { status: 404 })
  }

  if (run.status === 'completed') {
    return Response.json(
      {
        error: 'Run is already completed.',
      },
      { status: 409 },
    )
  }

  const nextItem: InsightRunResponseItem = {
    answeredAt: normalizeText(body.answeredAt) || new Date().toISOString(),
    cardKey: normalizeText(body.cardKey) || undefined,
    latencyMs:
      typeof body.latencyMs === 'number' && body.latencyMs >= 0 ? body.latencyMs : undefined,
    option,
    order,
    statement: normalizeText(body.statement) || undefined,
  }

  const existingResponses = normalizeResponses(run.responses)
  const withoutCurrentOrder = existingResponses.filter((item) => item.order !== order)
  const nextResponses = [...withoutCurrentOrder, nextItem].sort((a, b) => a.order - b.order)

  // Workaround: Clear responses first to avoid primary key conflicts
  await payload.update({
    id: run.id,
    collection: INSIGHT_RUNS_COLLECTION as never,
    data: {
      responses: [],
    },
    depth: 0,
  } as never)

  // Then update with new responses
  await payload.update({
    id: run.id,
    collection: INSIGHT_RUNS_COLLECTION as never,
    data: {
      responseCount: nextResponses.length,
      responses: nextResponses,
    },
    depth: 0,
  } as never)

  return Response.json({
    ok: true,
    responseCount: nextResponses.length,
    runId,
  })
}
