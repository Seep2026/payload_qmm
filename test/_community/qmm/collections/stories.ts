import type { CollectionConfig } from 'payload'

import { qmmSlugs, storyStatuses } from '../constants.js'
import { normalizeSlugBeforeValidate, recountTagUsage } from '../hooks/index.js'

export const StoriesCollection: CollectionConfig = {
  slug: qmmSlugs.stories,
  admin: {
    defaultColumns: ['title', 'slug', 'theme', 'status', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [recountTagUsage],
    beforeValidate: [normalizeSlugBeforeValidate({ fallbackField: 'title' })],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'theme',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.themes,
      required: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      hasMany: true,
      index: true,
      relationTo: qmmSlugs.tags,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: storyStatuses,
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'coverMedia',
      type: 'upload',
      relationTo: qmmSlugs.media,
    },
    {
      name: 'currentVersion',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.storyVersions,
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
    },
  ],
}
