import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import {
  DEFAULT_FINGERPRINT_FIRST_WORDS,
  DEFAULT_FINGERPRINT_SECOND_WORDS,
} from '../../app/(app)/utils/fingerprintLexiconDefaults.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { databaseAdapter } from '../databaseAdapter.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { UsersCollection } from './collections/Users/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
import { qmmCollections } from './qmm/collections/index.js'
import { qmmSlugs } from './qmm/constants.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const adapterInit = databaseAdapter.init

databaseAdapter.init = ({ payload }) => {
  const initializedAdapter = adapterInit({ payload })
  initializedAdapter.migrationDir = path.resolve(dirname, 'migrations')
  return initializedAdapter
}

export default buildConfigWithDefaults({
  // ...extend config here
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [PostsCollection, MediaCollection, UsersCollection, ...qmmCollections],
  db: databaseAdapter,
  editor: lexicalEditor({}),
  globals: [
    // ...add more globals here
    MenuGlobal,
  ],
  onInit: async (payload) => {
    const users = await payload.find({
      collection: 'users',
      limit: 1,
      where: {
        email: {
          equals: devUser.email,
        },
      },
    })

    if (!users.docs.length) {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
    }

    const posts = await payload.find({
      collection: postsSlug,
      limit: 1,
      where: {
        title: {
          equals: 'example post',
        },
      },
    })

    if (!posts.docs.length) {
      await payload.create({
        collection: postsSlug,
        data: {
          title: 'example post',
        },
      })
    }

    const lexicon = await payload.find({
      collection: qmmSlugs.fingerprintLexiconReleases,
      limit: 1,
      where: {
        status: {
          equals: 'active',
        },
      },
    })

    if (!lexicon.docs.length) {
      await payload.create({
        collection: qmmSlugs.fingerprintLexiconReleases,
        data: {
          activeFrom: new Date().toISOString(),
          firstWords: DEFAULT_FINGERPRINT_FIRST_WORDS.map((word) => ({
            enabled: true,
            weight: 1,
            word,
          })),
          locale: 'en',
          secondWords: DEFAULT_FINGERPRINT_SECOND_WORDS.map((word) => ({
            enabled: true,
            weight: 1,
            word,
          })),
          status: 'active',
          version: 'fp_v1_default',
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
