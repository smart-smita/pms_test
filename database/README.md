
# PMS Database Migration System

## Commands

**Run Migrations:**
`npm run db:migrate` (from backend folder, maps to `ts-node scripts/migrate_cli.ts`)

**Fresh Installation:**
Run the master schema in your database.
`mysql -u root pms_db < database/schema/master_schema.sql`

## Migrations Directory
Contains all .sql migration files in the `database/migrations/` directory.
