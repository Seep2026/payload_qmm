import crypto from 'node:crypto'

import { getPayloadClient } from '../seed/_shared.js'

const targetEmail = (process.env.QMM_APIKEY_USER_EMAIL || 'dev@payloadcms.com').trim()
const rotateAlways = process.env.QMM_APIKEY_ROTATE !== 'false'

const run = async () => {
  const payload = await getPayloadClient()

  const users = await payload.find({
    collection: 'users',
    limit: 1,
    where: {
      email: {
        equals: targetEmail,
      },
    },
  })

  if (!users.docs.length) {
    throw new Error(`User not found: ${targetEmail}`)
  }

  const user = users.docs[0] as {
    apiKey?: null | string
    enableAPIKey?: boolean
    id: number | string
  }

  const nextApiKey = rotateAlways || !user.apiKey ? crypto.randomUUID() : user.apiKey

  const updated = await payload.update({
    id: user.id,
    collection: 'users',
    data: {
      enableAPIKey: true,
      apiKey: nextApiKey,
    },
    depth: 0,
  })

  const resolvedApiKey = (updated as { apiKey?: string }).apiKey || nextApiKey

  // Keep output concise and script-friendly.
  console.log(`QMM_API_KEY=${resolvedApiKey}`)
  console.log(`AUTH_HEADER=users API-Key ${resolvedApiKey}`)
}

void run()
