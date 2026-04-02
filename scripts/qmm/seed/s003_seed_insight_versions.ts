import { qmmSlugs } from '../../../test/_community/qmm/constants.js'
import { getPayloadClient, upsertBySlug } from './_shared.js'

const cards = [
  '我最近更想安静，而不是连接。',
  '别人需要我时，我往往先回应对方，再看见自己。',
  '开始行动前，我常常会过度预演。',
  '即使没有外界压力，我也觉得自己还不够。',
  '比起建议，我更需要先被理解。',
  '我看起来平静，但内在常常已经很累。',
  '我习惯把情绪放到最后处理。',
  '当环境足够安全时，我愿意说出真实感受。',
  '我对别人情绪变化很敏感。',
  '此刻的我，更需要喘息，而不是方案。',
]

export const seedInsightVersions = async () => {
  const payload = await getPayloadClient()

  const insightSet = await upsertBySlug(payload, {
    collection: qmmSlugs.insightSets,
    data: {
      name: 'Quiet Carrying Signals',
      slug: 'quiet-carrying-signals',
      proposition: '识别那些被静默承担的心理负荷',
      description: '通过 10 张卡片识别当下的情绪节奏与承载方式。',
      status: 'active',
    },
    slug: 'quiet-carrying-signals',
  })

  const existingVersion = await payload.find({
    collection: qmmSlugs.insightSetVersions,
    limit: 1,
    where: {
      and: [
        {
          insightSet: {
            equals: insightSet.id,
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

  const versionData = {
    insightSet: insightSet.id,
    version: '2026.03.v1',
    status: 'published',
    introTitle: 'Begin with a feeling',
    introSubtitle: '用更轻的方式，先确认当下的自己。',
    resultMappingConfig: {
      type: 'score-band',
      bands: [
        { key: 'guarded_phase', max: 0.79, min: 0 },
        { key: 'mixed_reflection_phase', max: 1.39, min: 0.8 },
        { key: 'quiet_carrying_phase', max: 2, min: 1.4 },
      ],
    },
    changeNote: 'Initial seed version',
  }

  const insightSetVersion =
    existingVersion.docs.length > 0
      ? await payload.update({
          id: existingVersion.docs[0].id,
          collection: qmmSlugs.insightSetVersions,
          data: versionData,
        })
      : await payload.create({
          collection: qmmSlugs.insightSetVersions,
          data: versionData,
        })

  await payload.update({
    id: insightSet.id,
    collection: qmmSlugs.insightSets,
    data: {
      currentVersion: insightSetVersion.id,
    },
  })

  for (let index = 0; index < cards.length; index += 1) {
    const order = index + 1

    const existingCard = await payload.find({
      collection: qmmSlugs.insightCards,
      limit: 1,
      where: {
        and: [
          {
            insightSetVersion: {
              equals: insightSetVersion.id,
            },
          },
          {
            order: {
              equals: order,
            },
          },
        ],
      },
    })

    const cardData = {
      insightSetVersion: insightSetVersion.id,
      order,
      statement: cards[index],
      isActive: true,
      weight: 1,
    }

    if (existingCard.docs.length) {
      await payload.update({
        id: existingCard.docs[0].id,
        collection: qmmSlugs.insightCards,
        data: cardData,
      })
    } else {
      await payload.create({
        collection: qmmSlugs.insightCards,
        data: cardData,
      })
    }
  }

  payload.logger.info({ msg: '[qmm seed] s003 insight versions completed.' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void seedInsightVersions()
}
