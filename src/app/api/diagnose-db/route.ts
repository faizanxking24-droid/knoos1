import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

function serializeRow(row: any) {
  const result: any = {};
  for (const [key, value] of Object.entries(row)) {
    result[key] = typeof value === 'bigint' ? value.toString() : value;
  }
  return result;
}

export async function GET(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof Response) return adminCheck;

    const migrationHistory: any[] = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count, logs
      FROM \`_prisma_migrations\`
      WHERE migration_name IN (
        '20260927150000_repair_cart_user_foreign_key',
        '20260927160000_force_repair_cart_user_foreign_key'
      )
    `;

    const showCreateTable: any[] = await prisma.$queryRaw`SHOW CREATE TABLE \`Cart\``;
    
    const fkInfo: any[] = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Cart'
        AND COLUMN_NAME = 'userId'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `;

    const orphanCarts: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS total_orphans
      FROM \`Cart\` c
      LEFT JOIN \`User\` u ON u.id = c.userId
      WHERE u.id IS NULL
    `;

    const googleMappable: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS google_mappable_orphans
      FROM \`Cart\` c
      JOIN \`User\` u ON c.userId = u.googleId
      LEFT JOIN \`User\` u2 ON u2.id = c.userId
      WHERE u2.id IS NULL
    `;

    const rawData = {
      migrationHistory: migrationHistory.map(serializeRow),
      showCreateTable: showCreateTable[0] ? serializeRow(showCreateTable[0]) : null,
      fkInfo: fkInfo.map(serializeRow),
      total_orphans: orphanCarts[0] ? Number(orphanCarts[0].total_orphans) : 0,
      google_mappable_orphans: googleMappable[0] ? Number(googleMappable[0].google_mappable_orphans) : 0
    };

    return NextResponse.json(rawData);
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
