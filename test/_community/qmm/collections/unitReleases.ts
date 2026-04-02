import type { CollectionConfig } from 'payload'

import { qmmSlugs, releaseChannels, releaseStatuses } from '../constants.js'
import {
  autoCreateUnitIfNeeded,
  enforceUnitReleaseConsistency,
  ensureSingleActiveRelease,
} from '../hooks/index.js'

export const UnitReleasesCollection: CollectionConfig = {
  slug: qmmSlugs.unitReleases,
  admin: {
    defaultColumns: ['unit', 'status', 'channel', 'priority', 'startAt', 'endAt'],
    useAsTitle: 'status',
    description: 'Publish story and insight set combinations to the web.',
    components: {
      edit: {
        BeforeInput:
          '/app/(payload)/admin/components/UnitReleaseAutoCreator#UnitReleaseAutoCreator',
      },
    },
  },
  hooks: {
    beforeChange: [
      autoCreateUnitIfNeeded,
      enforceUnitReleaseConsistency,
      ensureSingleActiveRelease,
    ],
  },
  fields: [
    {
      name: 'themeId',
      type: 'text',
      admin: {
        hidden: true, // This is a temporary field used by the custom component
      },
    },
    {
      name: 'unit',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightStoryUnits,
      required: true,
      admin: {
        description: 'This field will be auto-filled when you select a Theme above.',
        readOnly: false, // Keep it editable in case manual adjustment is needed
      },
    },
    {
      name: 'storyVersion',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.storyVersions,
      required: true,
      admin: {
        description:
          'The version of the Story to publish. Above, select a Theme first, then click "Auto-Fill Form" to automatically select the correct Story Version. The dropdown shows: "Story Title (vX) - Status"',
        readOnly: false,
      },
    },
    {
      name: 'insightSetVersion',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightSetVersions,
      required: true,
      admin: {
        description:
          'The version of the Insight Set to publish. Above, select a Theme first, then click "Auto-Fill Form" to automatically select the correct InsightSet Version. The dropdown shows: "InsightSet Name (vX) - Status"',
        readOnly: false,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'scheduled',
      index: true,
      options: releaseStatuses,
      required: true,
    },
    {
      name: 'startAt',
      type: 'date',
      index: true,
      required: true,
    },
    {
      name: 'endAt',
      type: 'date',
      index: true,
    },
    {
      name: 'audienceRule',
      type: 'json',
    },
    {
      name: 'trafficWeight',
      type: 'number',
      defaultValue: 100,
      index: true,
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'channel',
      type: 'select',
      defaultValue: 'web',
      index: true,
      options: releaseChannels,
      required: true,
    },
  ],
}
