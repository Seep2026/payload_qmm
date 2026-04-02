import type { CollectionConfig } from 'payload'

import { attemptStatuses, qmmSlugs } from '../constants.js'

export const InsightAttemptsCollection: CollectionConfig = {
  slug: qmmSlugs.insightAttempts,
  admin: {
    defaultColumns: ['status', 'release', 'sessionId', 'startedAt', 'completedAt'],
    useAsTitle: 'sessionId',
  },
  fields: [
    {
      name: 'release',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.unitReleases,
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      index: true,
      relationTo: 'users',
    },
    {
      name: 'sessionId',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'startedAt',
      type: 'date',
      index: true,
      required: true,
    },
    {
      name: 'completedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'in_progress',
      index: true,
      options: attemptStatuses,
      required: true,
    },
    {
      name: 'resultKey',
      type: 'text',
      index: true,
    },
    {
      name: 'resultSnapshot',
      type: 'json',
    },
  ],
}
