import type { CollectionBeforeChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

/**
 * Automatically generates a display title for Story Versions
 * Format: "Story Title (vX) - Status"
 * Example: "The Taste of Clarity (v1) - published"
 */
export const generateStoryVersionDisplayTitle: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  if (!data) {
    return data
  }

  const storyID = relationToID(data.story)
  const version = data.version || ''
  const status = data.status || 'draft'

  let storyTitle = ''

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

  const displayTitle = `${storyTitle} (${version}) - ${status}`

  return {
    ...data,
    displayTitle,
  }
}
