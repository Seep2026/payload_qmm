import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  payload.logger.info({
    msg: '[qmm] m004 backfill normalize migration executed. Add data normalization logic when migrating old data.',
  })
  await Promise.resolve()
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info({ msg: '[qmm] m004 down migration executed (no-op).' })
  await Promise.resolve()
}
