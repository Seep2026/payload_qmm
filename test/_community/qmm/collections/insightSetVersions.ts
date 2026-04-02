import type { CollectionConfig } from 'payload'

import { qmmSlugs, versionStatuses } from '../constants.js'
import { generateInsightSetVersionDisplayTitle } from '../hooks/index.js'

export const InsightSetVersionsCollection: CollectionConfig = {
  slug: qmmSlugs.insightSetVersions,
  admin: {
    defaultColumns: ['displayTitle', 'insightSet', 'status', 'cardCount', 'updatedAt'],
    useAsTitle: 'displayTitle',
  },
  hooks: {
    beforeChange: [generateInsightSetVersionDisplayTitle],
  },
  fields: [
    {
      name: 'insightSet',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightSets,
      required: true,
    },
    {
      name: 'version',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'displayTitle',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated display title showing InsightSet Name (vX) - Status',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: versionStatuses,
      required: true,
    },
    {
      name: 'introTitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'introSubtitle',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'resultMappingConfig',
      type: 'json',
      required: true,
    },
    {
      name: 'cardCount',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'changeNote',
      type: 'textarea',
    },
  ],
}
