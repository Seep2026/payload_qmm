import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  payload.logger.info({
    msg: '[qmm] m002 compound indexes migration executed. Add DB-specific SQL when needed.',
  })
  await Promise.resolve()
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info({ msg: '[qmm] m002 down migration executed (no-op).' })
  await Promise.resolve()
}
