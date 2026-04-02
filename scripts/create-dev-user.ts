import { getPayload } from 'payload'

import { generateDatabaseAdapter } from '../test/generateDatabaseAdapter.js'

process.env.SQLITE_URL = process.env.SQLITE_URL || 'file:./payload-qmm.db'

const devUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

async function createDevUser() {
  // 初始化数据库适配器
  generateDatabaseAdapter('sqlite')

  // 动态导入配置
  const configModule = await import('../test/_community/config.js')
  const config = configModule.default

  const payload = await getPayload({ config })

  // 检查用户是否已存在
  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    where: {
      email: {
        equals: devUser.email,
      },
    },
  })

  if (existing.docs.length > 0) {
    console.log(`User ${devUser.email} already exists (id: ${existing.docs[0].id})`)
    return
  }

  // 创建用户
  const result = await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  console.log(`Created user: ${devUser.email}`)
  console.log(`User ID: ${result.id}`)
}

createDevUser().catch(console.error)
