import type { CollectionBeforeChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

export const enforceInsightCardOrder: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const order = typeof data?.order === 'number' ? data.order : undefined
  const insightSetVersionID = relationToID(data?.insightSetVersion)

  if (!order || order < 1 || !insightSetVersionID) {
    return data
  }

  const existing = await req.payload.find({
    collection: qmmSlugs.insightCards,
    limit: 1,
    where: {
      and: [
        {
          insightSetVersion: {
            equals: insightSetVersionID,
          },
        },
        {
          order: {
            equals: order,
          },
        },
      ],
    },
  })

  if (!existing.docs.length) {
    return data
  }

  const currentID = relationToID(originalDoc?.id)
  const duplicateID = relationToID(existing.docs[0]?.id)

  if (!currentID || currentID !== duplicateID) {
    throw new Error('Card order must be unique within an insight set version.')
  }

  return data
}
