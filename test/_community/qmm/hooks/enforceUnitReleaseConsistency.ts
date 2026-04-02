import type { CollectionBeforeChangeHook } from 'payload'

import { qmmSlugs } from '../constants.js'
import { relationToID } from '../utils.js'

type RelationDoc = {
  id: number | string
  insightSet?: { id?: number | string } | number | string
  story?: { id?: number | string } | number | string
}

const getRequiredID = (value: unknown, label: string): number | string => {
  const id = relationToID(value)

  if (!id) {
    throw new Error(`${label} is required.`)
  }

  return id
}

export const enforceUnitReleaseConsistency: CollectionBeforeChangeHook = async ({ data, req }) => {
  const unitID = getRequiredID(data?.unit, 'Unit')
  const storyVersionID = getRequiredID(data?.storyVersion, 'Story version')
  const insightSetVersionID = getRequiredID(data?.insightSetVersion, 'Insight set version')

  const unit = (await req.payload.findByID({
    id: unitID,
    collection: qmmSlugs.insightStoryUnits,
  })) as RelationDoc

  const storyVersion = (await req.payload.findByID({
    id: storyVersionID,
    collection: qmmSlugs.storyVersions,
  })) as RelationDoc

  const insightSetVersion = (await req.payload.findByID({
    id: insightSetVersionID,
    collection: qmmSlugs.insightSetVersions,
  })) as RelationDoc

  const unitStoryID = relationToID(unit.story)
  const unitInsightSetID = relationToID(unit.insightSet)
  const versionStoryID = relationToID(storyVersion.story)
  const versionInsightSetID = relationToID(insightSetVersion.insightSet)

  if (!unitStoryID || !unitInsightSetID || !versionStoryID || !versionInsightSetID) {
    throw new Error('Release references are incomplete. Please save related records first.')
  }

  if (unitStoryID !== versionStoryID) {
    throw new Error(
      `Story version mismatch: Unit is linked to Story "${unitStoryID}", but selected Story Version belongs to a different Story. Please select a Story Version that matches the Unit's Story.`,
    )
  }

  if (unitInsightSetID !== versionInsightSetID) {
    throw new Error(
      `InsightSet version mismatch: Unit is linked to InsightSet "${unitInsightSetID}", but selected InsightSet Version belongs to a different InsightSet. Please select an InsightSet Version that matches the Unit's InsightSet.`,
    )
  }

  return data
}
