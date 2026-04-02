import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { qmmSlugs, versionStatuses } from '../constants.js'
import { generateStoryVersionDisplayTitle } from '../hooks/index.js'

export const StoryVersionsCollection: CollectionConfig = {
  slug: qmmSlugs.storyVersions,
  admin: {
    defaultColumns: ['displayTitle', 'story', 'status', 'effectiveFrom', 'updatedAt'],
    useAsTitle: 'displayTitle',
  },
  hooks: {
    beforeChange: [generateStoryVersionDisplayTitle],
  },
  fields: [
    {
      name: 'story',
      type: 'relationship',
      index: true,
      relationTo: qmmSlugs.stories,
      required: true,
    },
    {
      name: 'version',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'displayTitle',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated display title showing Story Title (vX) - Status',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: versionStatuses,
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'contentBlocks',
      type: 'blocks',
      required: true,
      blocks: [
        {
          slug: 'richTextBlock',
          fields: [
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [...defaultFeatures],
              }),
              required: true,
            },
          ],
        },
        {
          slug: 'imageBlock',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: qmmSlugs.media,
              required: true,
            },
            {
              name: 'caption',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          slug: 'videoBlock',
          fields: [
            {
              name: 'videoURL',
              type: 'text',
            },
            {
              name: 'caption',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          slug: 'quoteBlock',
          fields: [
            {
              name: 'quote',
              type: 'textarea',
              localized: true,
              required: true,
            },
            {
              name: 'author',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'changeNote',
      type: 'textarea',
    },
    {
      name: 'effectiveFrom',
      type: 'date',
      index: true,
    },
    {
      name: 'effectiveTo',
      type: 'date',
      index: true,
    },
  ],
}
