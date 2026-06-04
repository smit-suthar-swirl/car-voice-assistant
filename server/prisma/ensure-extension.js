// Runs before `prisma db push` on deploy: the pgvector extension must exist
// before Prisma can create vector() columns. Idempotent + safe on a fresh DB.
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
try {
  await db.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector')
  await db.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  console.log('✓ pgvector + pgcrypto extensions ensured')
} catch (e) {
  console.error('Failed to create extensions:', e?.message || e)
  process.exit(1)
} finally {
  await db.$disconnect()
}
