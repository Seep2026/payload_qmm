import type { CollectionConfig } from 'payload'

import { qmmSlugs } from '../constants.js'

const localeOptions = [
  {
    label: 'English',
    value: 'en',
  },
] as const

const releaseStatusOptions = [
  {
    label: 'Draft',
    value: 'draft',
  },
  {
    label: 'Active',
    value: 'active',
  },
  {
    label: 'Archived',
    value: 'archived',
  },
] as const

export const FingerprintLexiconReleasesCollection: CollectionConfig = {
  slug: qmmSlugs.fingerprintLexiconReleases,
  admin: {
    defaultColumns: ['version', 'status', 'locale', 'activeFrom', 'updatedAt'],
    useAsTitle: 'version',
  },
  fields: [
    {
      name: 'version',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: releaseStatusOptions,
      required: true,
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'en',
      index: true,
      options: localeOptions,
      required: true,
    },
    {
      name: 'activeFrom',
      type: 'date',
      index: true,
    },
    {
      name: 'activeTo',
      type: 'date',
      index: true,
    },
    {
      name: 'firstWords',
      type: 'array',
      fields: [
        {
          name: 'word',
          type: 'text',
          required: true,
        },
        {
          name: 'weight',
          type: 'number',
          defaultValue: 1,
          min: 1,
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
      required: true,
    },
    {
      name: 'secondWords',
      type: 'array',
      fields: [
        {
          name: 'word',
          type: 'text',
          required: true,
        },
        {
          name: 'weight',
          type: 'number',
          defaultValue: 1,
          min: 1,
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
      required: true,
    },
    {
      name: 'bannedPairs',
      type: 'array',
      fields: [
        {
          name: 'firstWord',
          type: 'text',
          required: true,
        },
        {
          name: 'secondWord',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
