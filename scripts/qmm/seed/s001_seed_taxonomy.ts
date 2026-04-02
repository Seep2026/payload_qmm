import { qmmSlugs } from '../../../test/_community/qmm/constants.js'
import { getPayloadClient, upsertBySlug } from './_shared.js'

const themeSeed = {
  description: '围绕焦虑、关系、失眠、拖延等心理主题的内容空间。',
  name: '心理日常主题',
  priority: 100,
  slug: 'daily-mental-themes',
  status: 'operating',
}

const tagsSeed = [
  {
    name: '焦虑',
    slug: 'anxiety',
  },
  {
    name: '失眠',
    slug: 'insomnia',
  },
  {
    name: '关系',
    slug: 'relationship',
  },
  {
    name: '拖延',
    slug: 'procrastination',
  },
  {
    name: '社交回避',
    slug: 'social-avoidance',
  },
  {
    name: '自我否定',
    slug: 'self-criticism',
  },
]

export const seedTaxonomy = async () => {
  const payload = await getPayloadClient()

  await upsertBySlug(payload, {
    collection: qmmSlugs.themes,
    data: themeSeed,
    slug: themeSeed.slug,
  })

  for (const tag of tagsSeed) {
    await upsertBySlug(payload, {
      collection: qmmSlugs.tags,
      data: {
        ...tag,
        status: 'active',
      },
      slug: tag.slug,
    })
  }

  payload.logger.info({ msg: '[qmm seed] s001 taxonomy completed.' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void seedTaxonomy()
}
