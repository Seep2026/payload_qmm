import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  payload.logger.info({
    msg: '[qmm] m003 integrity constraints migration executed. Core integrity is currently enforced by hooks.',
  })
  await Promise.resolve()
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info({ msg: '[qmm] m003 down migration executed (no-op).' })
  await Promise.resolve()
}
