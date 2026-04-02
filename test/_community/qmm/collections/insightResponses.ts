import type { CollectionConfig } from 'payload'

import { qmmSlugs, responseOptions } from '../constants.js'

export const InsightResponsesCollection: CollectionConfig = {
  slug: qmmSlugs.insightResponses,
  admin: {
    defaultColumns: ['attempt', 'card', 'order', 'option', 'answeredAt'],
    useAsTitle: 'option',
  },
  fields: [
    {
      name: 'attempt',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightAttempts,
      required: true,
    },
    {
      name: 'card',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightCards,
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
      name: 'option',
      type: 'select',
      index: true,
      options: responseOptions,
      required: true,
    },
    {
      name: 'latencyMs',
      type: 'number',
      min: 0,
    },
    {
      name: 'answeredAt',
      type: 'date',
      index: true,
      required: true,
    },
  ],
}
