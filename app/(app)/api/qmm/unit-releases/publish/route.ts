import {
  assertOpenClawAuth,
  buildOpenClawAudienceRule,
  buildSchedulePayload,
  collectReleaseConflicts,
  createUnitRelease,
  evaluateFrontEndReadiness,
  findExistingReleaseByIdempotency,
  getPayloadClient,
  parseJSONBody,
  resolveChannel,
  resolveMode,
  resolveUnitReleaseInput,
  serializeResolved,
  type PublishInput,
} from '../_shared'

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

export const POST = async (request: Request) => {
  const authError = assertOpenClawAuth(request)
  if (authError) {
    return authError
  }

  const body = await parseJSONBody<PublishInput>(request)
  if (!body) {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  try {
    const payload = await getPayloadClient()
    const input: PublishInput = {
      ...body,
      channel: resolveChannel(body.channel),
      mode: resolveMode(body.mode),
    }

    const { resolved, unitCreated } = await resolveUnitReleaseInput(payload, input, {
      canCreateUnit: true,
    })
    const schedule = buildSchedulePayload(input, new Date())
    const unitID = resolved.unit.id as number | string

    const idempotencyKey = normalizeText(input.idempotencyKey)
    if (idempotencyKey) {
      const existed = await findExistingReleaseByIdempotency(payload, {
        channel: schedule.channel,
        idempotencyKey,
        unitID,
      })

      if (existed) {
        const readiness = await evaluateFrontEndReadiness(payload, resolved)
        return Response.json({
          checks: {
            activeCardCount: readiness.activeCardCount,
            readyForFrontEnd: readiness.readyForFrontEnd,
            reasons: readiness.reasons,
            willBeVisibleNow: schedule.channel === 'web' && schedule.status === 'active',
          },
          idempotentHit: true,
          release: {
            channel: existed.channel,
            endAt: existed.endAt || null,
            id: existed.id,
            priority: existed.priority,
            startAt: existed.startAt,
            status: existed.status,
          },
          resolution: serializeResolved(resolved),
          unitCreated,
        })
      }
    }

    const conflicts = await collectReleaseConflicts(payload, {
      channel: schedule.channel,
      unitID,
    })
    const audienceRule = buildOpenClawAudienceRule({
      channel: schedule.channel,
      idempotencyKey,
      mode: resolved.mode,
      note: input.note,
      themeSlug: normalizeText(resolved.theme.slug),
    })

    const created = await createUnitRelease(payload, {
      audienceRule,
      input,
      resolved,
      schedule,
    })
    const readiness = await evaluateFrontEndReadiness(payload, resolved)

    return Response.json(
      {
        checks: {
          activeCardCount: readiness.activeCardCount,
          readyForFrontEnd: readiness.readyForFrontEnd,
          reasons: readiness.reasons,
          willBeVisibleNow:
            schedule.channel === 'web' &&
            schedule.status === 'active' &&
            readiness.readyForFrontEnd,
        },
        conflicts: {
          activeReleaseCountBeforeCreate: conflicts.length,
          note:
            schedule.status === 'active' && conflicts.length
              ? 'Conflicting active releases on the same unit/channel will be auto-archived by hook.'
              : null,
        },
        idempotentHit: false,
        release: {
          channel: created.channel,
          endAt: created.endAt || null,
          id: created.id,
          priority: created.priority,
          startAt: created.startAt,
          status: created.status,
          unit: created.unit,
        },
        resolution: serializeResolved(resolved),
        schedule,
        unitCreated,
      },
      { status: 201 },
    )
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to publish unit release.',
      },
      { status: 400 },
    )
  }
}
