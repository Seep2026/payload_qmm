import type { CollectionConfig } from 'payload'

import { qmmSlugs, responseOptions } from '../constants.js'

export const InsightRunsCollection: CollectionConfig = {
  slug: qmmSlugs.insightRuns,
  admin: {
    defaultColumns: [
      'runId',
      'status',
      'themeName',
      'resultKey',
      'fingerprintPhrase',
      'completedAt',
      'updatedAt',
    ],
    useAsTitle: 'runId',
  },
  fields: [
    {
      name: 'runId',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'clientSessionId',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'flowVersion',
      type: 'text',
      index: true,
    },
    {
      name: 'themeId',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'themeName',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'themeSentence',
      type: 'text',
    },
    {
      name: 'storySlug',
      type: 'text',
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'in_progress',
      index: true,
      options: [
        {
          label: 'In Progress',
          value: 'in_progress',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Dropped',
          value: 'dropped',
        },
      ],
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
      name: 'resultKey',
      type: 'text',
      index: true,
    },
    {
      name: 'fingerprintPhrase',
      type: 'text',
      index: true,
    },
    {
      name: 'fingerprintVersion',
      type: 'text',
      index: true,
    },
    {
      name: 'fingerprintKey',
      type: 'text',
      index: true,
    },
    {
      name: 'responseCount',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'responses',
      type: 'array',
      fields: [
        {
          name: 'order',
          type: 'number',
          required: true,
        },
        {
          name: 'cardKey',
          type: 'text',
        },
        {
          name: 'statement',
          type: 'textarea',
        },
        {
          name: 'option',
          type: 'select',
          options: responseOptions,
          required: true,
        },
        {
          name: 'answeredAt',
          type: 'date',
          required: true,
        },
        {
          name: 'latencyMs',
          type: 'number',
          min: 0,
        },
      ],
    },
    {
      name: 'resultSnapshot',
      type: 'json',
    },
  ],
}
