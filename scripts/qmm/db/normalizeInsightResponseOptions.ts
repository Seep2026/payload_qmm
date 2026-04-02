import { getPayload } from 'payload'

import { qmmSlugs } from '../../../test/_community/qmm/constants.js'
import { generateDatabaseAdapter } from '../../../test/generateDatabaseAdapter.js'

const legacyOptionMap = {
  not_like_me: 'off',
  not_sure: 'unsure',
  very_like_me: 'right',
} as const

const getConfig = async () => {
  process.env.SQLITE_URL = process.env.SQLITE_URL || 'file:./payload-qmm.db'
  generateDatabaseAdapter('sqlite')
  const module = await import('../../../test/_community/config.js')
  return module.default
}

export const normalizeInsightResponseOptions = async (): Promise<void> => {
  const config = await getConfig()
  const payload = await getPayload({ config })

  const legacyOptions = Object.keys(legacyOptionMap)
  let page = 1
  let updatedCount = 0

  while (true) {
    const batch = await payload.find({
      collection: qmmSlugs.insightResponses,
      depth: 0,
      limit: 100,
      page,
      where: {
        option: {
          in: legacyOptions,
        },
      },
    })

    if (!batch.docs.length) {
      break
    }

    for (const doc of batch.docs) {
      const legacyOption = String(doc.option) as keyof typeof legacyOptionMap
      const normalizedOption = legacyOptionMap[legacyOption]

      if (!normalizedOption) {
        continue
      }

      await payload.update({
        id: doc.id,
        collection: qmmSlugs.insightResponses,
        data: {
          option: normalizedOption,
        },
      })

      updatedCount += 1
    }

    if (page >= batch.totalPages) {
      break
    }

    page += 1
  }

  payload.logger.info({
    msg: `[qmm db] normalized insight response options completed. Updated rows: ${updatedCount}.`,
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void normalizeInsightResponseOptions()
}
