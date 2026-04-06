import {
  assertOpenClawAuth,
  collectReleaseConflicts,
  evaluateFrontEndReadiness,
  getPayloadClient,
  parseJSONBody,
  resolveChannel,
  resolveMode,
  resolveUnitReleaseInput,
  serializeResolved,
  type PublishPreviewInput,
} from '../../_shared'

export const POST = async (request: Request) => {
  const authError = assertOpenClawAuth(request)
  if (authError) {
    return authError
  }

  const body = await parseJSONBody<PublishPreviewInput>(request)
  if (!body) {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  try {
    const payload = await getPayloadClient()
    const input: PublishPreviewInput = {
      ...body,
      channel: resolveChannel(body.channel),
      mode: resolveMode(body.mode),
    }

    const { resolved, unitCreated } = await resolveUnitReleaseInput(payload, input, {
      canCreateUnit: false,
    })
    const readiness = await evaluateFrontEndReadiness(payload, resolved)
    const unitID = resolved.unit.id as number | string
    const conflicts = await collectReleaseConflicts(payload, {
      channel: input.channel || 'web',
      unitID,
    })

    return Response.json({
      checks: {
        activeCardCount: readiness.activeCardCount,
        readyForFrontEnd: readiness.readyForFrontEnd,
        reasons: readiness.reasons,
      },
      conflicts: {
        activeReleaseCountSameUnitChannel: conflicts.length,
        releases: conflicts.map((release) => ({
          channel: release.channel,
          id: release.id,
          priority: release.priority,
          startAt: release.startAt,
          status: release.status,
        })),
      },
      resolution: serializeResolved(resolved),
      unitCreatedInPreview: unitCreated,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to resolve publish preview.',
      },
      { status: 400 },
    )
  }
}
