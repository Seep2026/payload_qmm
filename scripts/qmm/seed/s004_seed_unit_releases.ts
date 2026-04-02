import { qmmSlugs } from '../../../test/_community/qmm/constants.js'
import { relationToID } from '../../../test/_community/qmm/utils.js'
import { getPayloadClient } from './_shared.js'

export const seedUnitReleases = async () => {
  const payload = await getPayloadClient()

  const story = await payload.find({
    collection: qmmSlugs.stories,
    limit: 1,
    where: {
      slug: {
        equals: 'why-feelings-become-quiet-habits',
      },
    },
  })

  const insightSet = await payload.find({
    collection: qmmSlugs.insightSets,
    limit: 1,
    where: {
      slug: {
        equals: 'quiet-carrying-signals',
      },
    },
  })

  if (!story.docs.length || !insightSet.docs.length) {
    throw new Error('Story/InsightSet seed is missing. Run s002 and s003 first.')
  }

  const storyID = story.docs[0].id
  const insightSetID = insightSet.docs[0].id

  const unitExisting = await payload.find({
    collection: qmmSlugs.insightStoryUnits,
    limit: 1,
    where: {
      and: [
        {
          story: {
            equals: storyID,
          },
        },
        {
          insightSet: {
            equals: insightSetID,
          },
        },
      ],
    },
  })

  const unit =
    unitExisting.docs.length > 0
      ? await payload.update({
          id: unitExisting.docs[0].id,
          collection: qmmSlugs.insightStoryUnits,
          data: {
            note: 'quiet-habits-unit',
            status: 'active',
          },
        })
      : await payload.create({
          collection: qmmSlugs.insightStoryUnits,
          data: {
            story: storyID,
            insightSet: insightSetID,
            note: 'quiet-habits-unit',
            status: 'active',
          },
        })

  const storyVersionID = relationToID(story.docs[0].currentVersion)
  const insightSetVersionID = relationToID(insightSet.docs[0].currentVersion)

  if (!storyVersionID || !insightSetVersionID) {
    throw new Error('Current versions are missing. Ensure s002 and s003 linked currentVersion.')
  }

  const releaseExisting = await payload.find({
    collection: qmmSlugs.unitReleases,
    limit: 1,
    where: {
      and: [
        {
          unit: {
            equals: unit.id,
          },
        },
        {
          channel: {
            equals: 'web',
          },
        },
      ],
    },
  })

  const releaseData = {
    unit: unit.id,
    storyVersion: storyVersionID,
    insightSetVersion: insightSetVersionID,
    status: 'active',
    channel: 'web',
    priority: 100,
    trafficWeight: 100,
    startAt: new Date().toISOString(),
  }

  if (releaseExisting.docs.length > 0) {
    await payload.update({
      id: releaseExisting.docs[0].id,
      collection: qmmSlugs.unitReleases,
      data: releaseData,
    })
  } else {
    await payload.create({
      collection: qmmSlugs.unitReleases,
      data: releaseData,
    })
  }

  payload.logger.info({ msg: '[qmm seed] s004 unit releases completed.' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void seedUnitReleases()
}
