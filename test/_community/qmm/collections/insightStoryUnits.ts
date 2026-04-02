import type { CollectionConfig } from 'payload'

import { qmmSlugs, unitStatuses } from '../constants.js'
import { generateUnitDisplayTitle } from '../hooks/index.js'

export const InsightStoryUnitsCollection: CollectionConfig = {
  slug: qmmSlugs.insightStoryUnits,
  admin: {
    defaultColumns: ['displayTitle', 'status', 'updatedAt'],
    useAsTitle: 'displayTitle',
  },
  hooks: {
    beforeChange: [generateUnitDisplayTitle],
  },
  fields: [
    {
      name: 'story',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.stories,
      required: true,
      unique: true,
    },
    {
      name: 'insightSet',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightSets,
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      index: true,
      options: unitStatuses,
      required: true,
    },
    {
      name: 'note',
      type: 'text',
      defaultValue: 'unit',
    },
    {
      name: 'displayTitle',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated display title showing Story and InsightSet names',
      },
    },
  ],
}
