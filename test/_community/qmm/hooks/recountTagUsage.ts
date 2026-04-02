import type { CollectionAfterChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { asArray, relationToID } from '../utils.js'

export const recountTagUsage: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const affectedTagIDs = new Set<number | string>()

  for (const item of asArray(doc?.tags)) {
    const id = relationToID(item)
    if (id) {
      affectedTagIDs.add(id)
    }
  }

  for (const item of asArray(previousDoc?.tags)) {
    const id = relationToID(item)
    if (id) {
      affectedTagIDs.add(id)
    }
  }

  for (const tagID of affectedTagIDs) {
    const stories = await req.payload.find({
      collection: qmmSlugs.stories,
      depth: 0,
      limit: 1,
      where: {
        tags: {
          contains: tagID,
        },
      },
    })

    await req.payload.update({
      id: tagID,
      collection: qmmSlugs.tags,
      data: {
        usageCount: stories.totalDocs,
      },
      depth: 0,
    })
  }

  return doc
}
