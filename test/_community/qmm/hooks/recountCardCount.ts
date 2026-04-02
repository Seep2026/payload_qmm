import type { CollectionAfterChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

export const recountCardCount: CollectionAfterChangeHook = async ({ doc, req }) => {
  const insightSetVersionID = relationToID(doc?.insightSetVersion)

  if (!insightSetVersionID) {
    return doc
  }

  const cards = await req.payload.find({
    collection: qmmSlugs.insightCards,
    depth: 0,
    limit: 1,
    where: {
      insightSetVersion: {
        equals: insightSetVersionID,
      },
    },
  })

  await req.payload.update({
    id: insightSetVersionID,
    collection: qmmSlugs.insightSetVersions,
    data: {
      cardCount: cards.totalDocs,
    },
    depth: 0,
  })

  return doc
}
