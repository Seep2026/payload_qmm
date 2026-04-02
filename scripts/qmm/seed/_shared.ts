import { getPayload } from 'payload'

import { generateDatabaseAdapter } from '../../../test/generateDatabaseAdapter.js'

const getConfig = async () => {
  process.env.SQLITE_URL = process.env.SQLITE_URL || 'file:./payload-qmm.db'
  generateDatabaseAdapter('sqlite')
  const module = await import('../../../test/_community/config.js')
  return module.default
}

export const getPayloadClient = async () => {
  const config = await getConfig()
  return await getPayload({ config })
}

export const upsertBySlug = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  args: {
    collection: string
    data: Record<string, unknown>
    slug: string
  },
) => {
  const existing = await payload.find({
    collection: args.collection,
    limit: 1,
    where: {
      slug: {
        equals: args.slug,
      },
    },
  })

  if (existing.docs.length) {
    const doc = existing.docs[0]

    return await payload.update({
      id: doc.id,
      collection: args.collection,
      data: args.data,
    })
  }

  return await payload.create({
    collection: args.collection,
    data: args.data,
  })
}
