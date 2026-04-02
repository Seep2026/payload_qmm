import type { CollectionBeforeChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

/**
 * This hook automatically creates the required Unit (insight-story-unit) if it doesn't exist
 * when creating a Unit Release. It expects the form to have a hidden field or context
 * with the theme ID.
 */
export const autoCreateUnitIfNeeded: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  // If unit is already provided, skip
  if (data?.unit) {
    return data
  }

  // Try to get theme ID from form data or context
  // This assumes the custom component sets a themeId in the form data
  const themeID = relationToID((data as any)?.themeId)

  if (!themeID) {
    return data // Cannot auto-create without theme context
  }

  // Find story and insightSet for this theme
  const stories = await req.payload.find({
    collection: qmmSlugs.stories,
    where: {
      theme: {
        equals: themeID,
      },
    },
    limit: 1,
  })

  const insightSets = await req.payload.find({
    collection: qmmSlugs.insightSets,
    where: {
      theme: {
        equals: themeID,
      },
    },
    limit: 1,
  })

  const story = stories.docs?.[0]
  const insightSet = insightSets.docs?.[0]

  if (!story || !insightSet) {
    throw new Error(
      `Cannot auto-create Unit: Theme ${themeID} is missing required Story or InsightSet. Please ensure both exist before creating a Unit Release.`,
    )
  }

  // Check if unit already exists
  const existingUnits = await req.payload.find({
    collection: qmmSlugs.insightStoryUnits,
    where: {
      and: [
        {
          story: {
            equals: story.id,
          },
        },
        {
          insightSet: {
            equals: insightSet.id,
          },
        },
      ],
    },
    limit: 1,
  })

  let unitID = existingUnits.docs?.[0]?.id

  // Create unit if it doesn't exist
  if (!unitID) {
    const newUnit = await req.payload.create({
      collection: qmmSlugs.insightStoryUnits,
      data: {
        story: story.id,
        insightSet: insightSet.id,
        status: 'active',
        note: `Auto-created for theme ${themeID}`,
      },
    })
    unitID = newUnit.id
  }

  return {
    ...data,
    unit: unitID,
  }
}
