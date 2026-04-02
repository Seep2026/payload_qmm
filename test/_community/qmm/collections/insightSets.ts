import type { CollectionConfig } from 'payload'

import { qmmSlugs } from '../constants.js'
import { normalizeSlugBeforeValidate } from '../hooks/index.js'

export const InsightSetsCollection: CollectionConfig = {
  slug: qmmSlugs.insightSets,
  admin: {
    defaultColumns: ['name', 'slug', 'theme', 'status', 'updatedAt'],
    useAsTitle: 'name',
  },
  hooks: {
    beforeValidate: [normalizeSlugBeforeValidate({ fallbackField: 'name' })],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'proposition',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'theme',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.themes,
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Paused',
          value: 'paused',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'currentVersion',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.insightSetVersions,
    },
  ],
}
