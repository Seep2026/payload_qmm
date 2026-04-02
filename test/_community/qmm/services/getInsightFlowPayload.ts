import type { BasePayload } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'
import { resolveActiveRelease } from './resolveActiveRelease.js'

type GetInsightFlowPayloadArgs = {
  channel?: 'h5' | 'miniapp' | 'web'
  unitID: number | string
}

export const getInsightFlowPayload = async (
  payload: BasePayload,
  args: GetInsightFlowPayloadArgs,
): Promise<{
  cards: unknown[]
  release: Record<string, unknown>
  storyVersionID: number | string
} | null> => {
  const release = await resolveActiveRelease(payload, {
    channel: args.channel,
    unitID: args.unitID,
  })

  if (!release) {
    return null
  }

  const insightSetVersionID = relationToID(release.insightSetVersion)
  const storyVersionID = relationToID(release.storyVersion)

  if (!insightSetVersionID || !storyVersionID) {
    return null
  }

  const cards = await payload.find({
    collection: qmmSlugs.insightCards,
    depth: 0,
    limit: 200,
    sort: 'order',
    where: {
      and: [
        {
          insightSetVersion: {
            equals: insightSetVersionID,
          },
        },
        {
          isActive: {
            equals: true,
          },
        },
      ],
    },
  })

  return {
    cards: cards.docs,
    release,
    storyVersionID,
  }
}
