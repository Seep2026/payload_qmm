import type { CollectionBeforeChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

/**
 * Automatically generates a display title for InsightSet Versions
 * Format: "InsightSet Name (vX) - Status"
 * Example: "Understanding Anxiety and Appetite (v1) - published"
 */
export const generateInsightSetVersionDisplayTitle: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  if (!data) {
    return data
  }

  const insightSetID = relationToID(data.insightSet)
  const version = data.version || ''
  const status = data.status || 'draft'

  let insightSetName = ''

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

  const displayTitle = `${insightSetName} (${version}) - ${status}`

  return {
    ...data,
    displayTitle,
  }
}
