import { qmmSlugs } from '../../../test/_community/qmm/constants.js'
import { getPayloadClient } from './_shared.js'

const options = ['off', 'unsure', 'right'] as const

export const seedDemoAttempts = async () => {
  const payload = await getPayloadClient()

  const release = await payload.find({
    collection: qmmSlugs.unitReleases,
    limit: 1,
    where: {
      status: {
        equals: 'active',
      },
    },
  })

  if (!release.docs.length) {
    throw new Error('Active release is missing. Run s004 first.')
  }

  const attempt = await payload.create({
    collection: qmmSlugs.insightAttempts,
    data: {
      release: release.docs[0].id,
      sessionId: `seed-${Date.now()}`,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      resultKey: 'mixed_reflection_phase',
      resultSnapshot: {
        source: 'seed',
      },
    },
  })

  const cards = await payload.find({
    collection: qmmSlugs.insightCards,
    depth: 0,
    limit: 10,
    sort: 'order',
  })

  for (let index = 0; index < cards.docs.length; index += 1) {
    await payload.create({
      collection: qmmSlugs.insightResponses,
      data: {
        attempt: attempt.id,
        card: cards.docs[index].id,
        order: index + 1,
        option: options[index % options.length],
        latencyMs: 1200 + index * 130,
        answeredAt: new Date().toISOString(),
      },
    })
  }

  payload.logger.info({ msg: '[qmm seed] s005 demo attempts completed.' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void seedDemoAttempts()
}
