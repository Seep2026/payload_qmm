import { qmmSlugs } from '../../../test/_community/qmm/constants.js'
import { getPayloadClient, upsertBySlug } from './_shared.js'

export const seedStoryVersions = async () => {
  const payload = await getPayloadClient()

  const theme = await payload.find({
    collection: qmmSlugs.themes,
    limit: 1,
    where: {
      slug: {
        equals: 'daily-mental-themes',
      },
    },
  })

  if (!theme.docs.length) {
    throw new Error('Theme seed is missing. Run s001 first.')
  }

  const tags = await payload.find({
    collection: qmmSlugs.tags,
    limit: 100,
    where: {
      slug: {
        in: ['anxiety', 'relationship', 'self-criticism'],
      },
    },
  })

  const story = await upsertBySlug(payload, {
    collection: qmmSlugs.stories,
    data: {
      title: '为什么我们把感受变成沉默习惯',
      slug: 'why-feelings-become-quiet-habits',
      status: 'published',
      summary: '从日常里看见那些被延迟命名的内在感受。',
      theme: theme.docs[0].id,
      tags: tags.docs.map((tag) => tag.id),
      publishedAt: new Date().toISOString(),
    },
    slug: 'why-feelings-become-quiet-habits',
  })

  const existingVersion = await payload.find({
    collection: qmmSlugs.storyVersions,
    limit: 1,
    where: {
      and: [
        {
          story: {
            equals: story.id,
          },
        },
        {
          version: {
            equals: '2026.03.v1',
          },
        },
      ],
    },
  })

  const storyVersionData = {
    story: story.id,
    version: '2026.03.v1',
    status: 'published',
    title: 'Why We Turn Feelings Into Quiet Habits',
    subtitle: 'A short reflection on how emotional patterns become everyday routines.',
    contentBlocks: [
      {
        blockType: 'quoteBlock',
        quote: '你并不是不清楚，只是太习惯把自己放在后面。',
        author: 'QMM 编辑部',
      },
      {
        blockType: 'quoteBlock',
        quote: '当我们先被理解，再被建议，内心通常会更有空间。',
        author: 'QMM 编辑部',
      },
    ],
    changeNote: 'Initial seed version',
    effectiveFrom: new Date().toISOString(),
  }

  const storyVersion =
    existingVersion.docs.length > 0
      ? await payload.update({
          id: existingVersion.docs[0].id,
          collection: qmmSlugs.storyVersions,
          data: storyVersionData,
        })
      : await payload.create({
          collection: qmmSlugs.storyVersions,
          data: storyVersionData,
        })

  await payload.update({
    id: story.id,
    collection: qmmSlugs.stories,
    data: {
      currentVersion: storyVersion.id,
    },
  })

  payload.logger.info({ msg: '[qmm seed] s002 story versions completed.' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void seedStoryVersions()
}
