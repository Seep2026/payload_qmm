import type { CollectionConfig } from 'payload'

import { qmmSlugs, tagStatuses } from '../constants.js'
import { normalizeSlugBeforeValidate } from '../hooks/index.js'

export const TagsCollection: CollectionConfig = {
  slug: qmmSlugs.tags,
  admin: {
    defaultColumns: ['name', 'slug', 'status', 'heatScore', 'usageCount', 'updatedAt'],
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
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      index: true,
      options: tagStatuses,
      required: true,
    },
    {
      name: 'heatScore',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'mergeTo',
      type: 'relationship',
      relationTo: qmmSlugs.tags,
    },
    {
      name: 'deprecatedAt',
      type: 'date',
    },
  ],
}
