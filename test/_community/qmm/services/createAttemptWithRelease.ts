import type { BasePayload } from 'payload'

import { qmmSlugs } from '../constants.js'

type CreateAttemptWithReleaseArgs = {
  releaseID: number | string
  sessionID: string
  userID?: number | string
}

export const createAttemptWithRelease = async (
  payload: BasePayload,
  args: CreateAttemptWithReleaseArgs,
) => {
  return await payload.create({
    collection: qmmSlugs.insightAttempts,
    data: {
      release: args.releaseID,
      sessionId: args.sessionID,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      ...(args.userID
        ? {
            user: args.userID,
          }
        : {}),
    },
  })
}
