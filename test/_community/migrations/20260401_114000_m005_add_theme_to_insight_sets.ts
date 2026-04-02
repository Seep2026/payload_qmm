import type { MigrateUpArgs } from '@payloadcms/db-sqlite'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Add theme_id column to insight_sets table (allow NULL initially)
  await payload.db.drizzle.run(
    sql`
      ALTER TABLE insight_sets 
      ADD COLUMN theme_id INTEGER 
      REFERENCES themes(id) 
      ON DELETE SET NULL
    `,
  )

  // Create index on theme_id
  await payload.db.drizzle.run(
    sql`
      CREATE INDEX insight_sets_theme_idx 
      ON insight_sets(theme_id)
    `,
  )

  // Update existing insight_sets to associate with a theme
  // For now, we'll associate them with the first theme (id=1)
  // You may want to adjust this logic based on your data
  await payload.db.drizzle.run(
    sql`
      UPDATE insight_sets 
      SET theme_id = 1 
      WHERE theme_id IS NULL
    `,
  )

  // Now make theme_id NOT NULL
  await payload.db.drizzle.run(
    sql`
      ALTER TABLE insight_sets 
      ALTER COLUMN theme_id SET NOT NULL
    `,
  )
}

// Helper to create SQL query
function sql(strings: TemplateStringsArray, ...values: any[]) {
  return String.raw({ raw: strings }, ...values)
}
