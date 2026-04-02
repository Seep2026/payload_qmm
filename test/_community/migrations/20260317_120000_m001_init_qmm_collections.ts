import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  payload.logger.info({
    msg: '[qmm] m001 init collections migration executed (schema managed by Payload config).',
  })
  await Promise.resolve()
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info({ msg: '[qmm] m001 down migration executed (no-op).' })
  await Promise.resolve()
}
