# Prisma Migration Guide

## Quick Reference

```bash
npx prisma migrate dev      # Create & apply migration (development)
npx prisma migrate deploy   # Apply migrations (production)
npx prisma db push          # Push schema without migration files
npx prisma generate         # Regenerate client after schema changes
npx prisma studio           # Open database GUI
```

---

## Development Workflow

### 1. Modify Your Schema

Edit `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]   // Add new relation
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Add new model
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}
```

### 2. Create a Migration

```bash
npx prisma migrate dev --name add_posts_table
```

This will:
- Generate a migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma client

Migration files are created at:
```
prisma/migrations/
├── 20240101120000_init/
│   └── migration.sql
├── 20240102150000_add_posts_table/
│   └── migration.sql
└── migration_lock.toml
```

### 3. Regenerate Client (if needed)

```bash
npx prisma generate
```

---

## Production Deployment

For production (CI/CD), use:

```bash
npx prisma migrate deploy
```

This applies all pending migrations without creating new ones.

---

## Reverting Migrations (Comparison with Alembic)

### Key Difference from Alembic

**Prisma does NOT have automatic rollback/downgrade like Alembic.**

| Feature | Alembic | Prisma |
|---------|---------|--------|
| Auto-generate migrations | Yes | Yes |
| Up migration | `alembic upgrade` | `prisma migrate deploy` |
| Down migration | `alembic downgrade` | **Not supported** |
| Rollback to revision | `alembic downgrade <rev>` | Manual only |

### How to Revert in Prisma

#### Option 1: Create a New Migration (Recommended)

Create a new migration that undoes the changes:

```bash
# 1. Modify schema.prisma to remove/revert changes
# 2. Create a new migration
npx prisma migrate dev --name revert_posts_table
```

#### Option 2: Manual SQL Rollback

```bash
# 1. Connect to your database and run SQL manually
# 2. Mark migration as rolled back
npx prisma migrate resolve --rolled-back 20240102150000_add_posts_table
```

#### Option 3: Reset Database (Development Only)

```bash
# WARNING: This deletes all data!
npx prisma migrate reset
```

This will:
- Drop the database
- Create a new database
- Apply all migrations
- Run seed script (if configured)

---

## Supabase-Specific Notes

### Pushing to Supabase

```bash
# Development: Use db push for quick prototyping
npx prisma db push

# Production: Use migrations for version control
npx prisma migrate deploy
```

### Connection String Format

Your `.env` should have:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
```

For Supabase with connection pooling (recommended):
```env
# Transaction mode (port 6543) - for Prisma
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session mode (port 5432) - for migrations
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Update `schema.prisma` for pooling:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For migrations
}
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev` | Create and apply migration |
| `npx prisma migrate dev --name <name>` | Create migration with custom name |
| `npx prisma migrate deploy` | Apply pending migrations (production) |
| `npx prisma migrate reset` | Reset database and reapply all migrations |
| `npx prisma migrate status` | Check migration status |
| `npx prisma db push` | Push schema without migration file |
| `npx prisma db pull` | Pull schema from existing database |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Open database GUI |
| `npx prisma format` | Format schema file |

---

## Best Practices

1. **Always use migrations in production** - `db push` is for prototyping only
2. **Commit migration files** - They should be in version control
3. **Never edit existing migrations** - Create new ones instead
4. **Test migrations locally** before deploying
5. **Backup before destructive migrations** - Prisma warns about data loss
