import type { CollectionConfig } from 'payload'

import { qmmSlugs, themeStatuses } from '../constants.js'
import { normalizeSlugBeforeValidate, stampThemeArchivedAt } from '../hooks/index.js'

export const ThemesCollection: CollectionConfig = {
  slug: qmmSlugs.themes,
  admin: {
    defaultColumns: ['name', 'slug', 'status', 'priority', 'updatedAt'],
    useAsTitle: 'name',
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'defined',
      index: true,
      options: themeStatuses,
      required: true,
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'archivedAt',
      type: 'date',
    },
  ],
  hooks: {
    beforeChange: [stampThemeArchivedAt],
    beforeValidate: [normalizeSlugBeforeValidate({ fallbackField: 'name' })],
  },
}
