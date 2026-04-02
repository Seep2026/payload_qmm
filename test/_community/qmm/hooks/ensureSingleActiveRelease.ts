import type { CollectionBeforeChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

export const ensureSingleActiveRelease: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (data?.status !== 'active') {
    return data
  }

  const unitID = relationToID(data?.unit)
  const channel = typeof data?.channel === 'string' ? data.channel : 'web'

  if (!unitID) {
    throw new Error('Unit is required when activating a release.')
  }

  const existing = await req.payload.find({
    collection: qmmSlugs.unitReleases,
    depth: 0,
    limit: 10,
    where: {
      and: [
        {
          unit: {
            equals: unitID,
          },
        },
        {
          channel: {
            equals: channel,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  const currentID = relationToID(originalDoc?.id)
  const conflicts = existing.docs.filter((doc) => {
    const id = relationToID(doc.id)
    return !currentID || currentID !== id
  })

  // Auto-archive old active releases instead of throwing error
  if (conflicts.length) {
    for (const conflict of conflicts) {
      await req.payload.update({
        collection: qmmSlugs.unitReleases,
        id: conflict.id,
        data: {
          status: 'archived',
        },
      })
    }
  }

  return data
}
