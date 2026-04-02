import type { BasePayload } from 'payload'

import { qmmSlugs } from '../constants.js'

type ResolveActiveReleaseArgs = {
  at?: Date
  channel?: 'h5' | 'miniapp' | 'web'
  unitID: number | string
}

const isWithinWindow = (
  candidate: {
    endAt?: null | string
    startAt?: null | string
  },
  at: Date,
): boolean => {
  const startAt = candidate.startAt ? new Date(candidate.startAt) : undefined
  const endAt = candidate.endAt ? new Date(candidate.endAt) : undefined

  if (startAt && startAt > at) {
    return false
  }

  if (endAt && endAt <= at) {
    return false
  }

  return true
}

export const resolveActiveRelease = async (
  payload: BasePayload,
  args: ResolveActiveReleaseArgs,
): Promise<null | Record<string, unknown>> => {
  const at = args.at || new Date()

  const releases = await payload.find({
    collection: qmmSlugs.unitReleases,
    depth: 1,
    limit: 50,
    sort: '-priority',
    where: {
      and: [
        {
          unit: {
            equals: args.unitID,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
        {
          channel: {
            equals: args.channel || 'web',
          },
        },
      ],
    },
  })

  const candidate = releases.docs.find((doc) => {
    const entry = doc as { endAt?: null | string; startAt?: null | string }
    return isWithinWindow(entry, at)
  })

  return (candidate as Record<string, unknown>) || null
}
