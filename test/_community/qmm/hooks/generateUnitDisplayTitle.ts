import type { CollectionBeforeChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

export const generateUnitDisplayTitle: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) {
    return data
  }

  const storyID = relationToID(data.story)
  const insightSetID = relationToID(data.insightSet)

  let storyTitle = ''
  let insightSetName = ''

  if (storyID) {
    try {
      const story = await req.payload.findByID({
        id: storyID,
        collection: qmmSlugs.stories,
      })
      storyTitle = story?.title || `Story-${storyID}`
    } catch {
      storyTitle = `Story-${storyID}`
    }
  }

  if (insightSetID) {
    try {
      const insightSet = await req.payload.findByID({
        id: insightSetID,
        collection: qmmSlugs.insightSets,
      })
      insightSetName = insightSet?.name || `InsightSet-${insightSetID}`
    } catch {
      insightSetName = `InsightSet-${insightSetID}`
    }
  }

  const displayTitle = `${storyTitle} + ${insightSetName}`

  return {
    ...data,
    displayTitle,
  }
}
