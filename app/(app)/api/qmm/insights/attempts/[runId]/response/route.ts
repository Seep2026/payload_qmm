import {
  findRunByRunID,
  getPayloadClient,
  INSIGHT_RUNS_COLLECTION,
  type InsightRunResponseItem,
  isInsightOptionValue,
  parseJSONBody,
} from '../../../_shared'

type SaveResponseBody = {
  answeredAt?: string
  cardKey?: string
  latencyMs?: number
  option?: string
  order?: number
  statement?: string
}

type StoredResponseItem = {
  id?: number | string
} & InsightRunResponseItem

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const getParamRunID = async (context: {
  params: { runId: string } | Promise<{ runId: string }>
}): Promise<string> => {
  const params = await Promise.resolve(context.params)
  return normalizeText(params.runId)
}

const normalizeResponses = (value: unknown): StoredResponseItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): null | StoredResponseItem => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>
      if (
        typeof record.order !== 'number' ||
        typeof record.answeredAt !== 'string' ||
        !isInsightOptionValue(record.option)
      ) {
        return null
      }

      return {
        id: typeof record.id === 'number' || typeof record.id === 'string' ? record.id : undefined,
        answeredAt: record.answeredAt,
        cardKey: normalizeText(record.cardKey) || undefined,
        latencyMs: typeof record.latencyMs === 'number' ? record.latencyMs : undefined,
        option: record.option,
        order: record.order,
        statement: normalizeText(record.statement) || undefined,
      }
    })
    .filter((item): item is StoredResponseItem => Boolean(item))
    .sort((a, b) => a.order - b.order)
}

export const POST = async (
  request: Request,
  context: { params: { runId: string } | Promise<{ runId: string }> },
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

  const existingAtOrder = existingResponses.find((item) => item.order === order)
  const isNoopUpdate =
    existingAtOrder &&
    existingAtOrder.option === nextItem.option &&
    normalizeText(existingAtOrder.cardKey) === normalizeText(nextItem.cardKey) &&
    normalizeText(existingAtOrder.statement) === normalizeText(nextItem.statement)

  if (isNoopUpdate) {
    return Response.json({
      ok: true,
      responseCount: existingResponses.length,
      runId,
    })
  }

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
