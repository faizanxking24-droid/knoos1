import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '@/lib/prisma';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('key') !== 'knoos-diag-123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let migrateStatus = '';
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate status');
      migrateStatus = stdout + '\n' + stderr;
    } catch (e: any) {
      migrateStatus = e.stdout + '\n' + e.stderr + '\n' + e.message;
    }

    const showCreateTable: any = await prisma.$queryRaw`SHOW CREATE TABLE \`Cart\``;
    
    const orphanCarts: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM \`Cart\` c
      LEFT JOIN \`User\` u ON u.id = c.userId
      WHERE u.id IS NULL
    `;

    return NextResponse.json({
      migrateStatus,
      showCreateTable: showCreateTable,
      orphanCarts: orphanCarts[0]?.count != null ? Number(orphanCarts[0].count) : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
