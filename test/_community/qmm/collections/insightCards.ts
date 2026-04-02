import type { CollectionConfig } from 'payload'

import { qmmSlugs } from '../constants.js'
import { enforceInsightCardOrder, recountCardCount } from '../hooks/index.js'

export const InsightCardsCollection: CollectionConfig = {
  slug: qmmSlugs.insightCards,
  admin: {
    defaultColumns: ['insightSetVersion', 'order', 'statement', 'isActive', 'updatedAt'],
    useAsTitle: 'statement',
  },
  hooks: {
    afterChange: [recountCardCount],
    beforeChange: [enforceInsightCardOrder],
  },
  fields: [
    {
      name: 'insightSetVersion',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightSetVersions,
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      index: true,
      min: 1,
      required: true,
    },
    {
      name: 'statement',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'hint',
      type: 'text',
      localized: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
    {
      name: 'weight',
      type: 'number',
      defaultValue: 1,
    },
  ],
}
