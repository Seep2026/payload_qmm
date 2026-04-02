import { getPayload } from 'payload'

import { generateDatabaseAdapter } from '../../../test/generateDatabaseAdapter.js'

const getConfig = async () => {
  process.env.SQLITE_URL = process.env.SQLITE_URL || 'file:./payload-qmm.db'
  generateDatabaseAdapter('sqlite')
  const module = await import('../../../test/_community/config.js')
  return module.default
}

type Action = 'down' | 'fresh' | 'migrate' | 'status'

const run = async (action: Action) => {
  const config = await getConfig()
  const payload = await getPayload({ config })

  switch (action) {
    case 'down':
      await payload.db.migrateDown()
      break
    case 'fresh':
      if ('migrateFresh' in payload.db && typeof payload.db.migrateFresh === 'function') {
        await payload.db.migrateFresh({ forceAcceptWarning: true })
      }
      break
    case 'migrate':
      await payload.db.migrateStatus()
      payload.logger.info({
        msg: '[qmm db] migrate is configured as non-interactive status mode in this scaffold. Add SQL up/down bodies before enabling full migrate.',
      })
      break
    case 'status':
      await payload.db.migrateStatus()
      break
    default:
      throw new Error(`Unsupported action: ${action}`)
  }

  payload.logger.info({ msg: `[qmm db] ${String(action)} completed.` })
}

const action = process.argv[2] as Action | undefined

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!action) {
    throw new Error('Please provide an action: status | migrate | down | fresh')
  }

  void run(action)
}

export { run }
