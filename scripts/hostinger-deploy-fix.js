const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING HOSTINGER DB DIAGNOSIS & REPAIR ===");
  
  const diagData = {};

  try {
    // 1. Get migration history
    const history = await prisma.$queryRaw`
        SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count
        FROM \`_prisma_migrations\`
        WHERE migration_name IN (
          '20260927150000_repair_cart_user_foreign_key',
          '20260927160000_force_repair_cart_user_foreign_key'
        )
    `;
    diagData.migrationHistory = history.map(r => ({
      migration_name: r.migration_name,
      started_at: r.started_at,
      finished_at: r.finished_at,
      rolled_back_at: r.rolled_back_at,
      applied_steps_count: r.applied_steps_count
    }));

    // 2. Count orphans
    const orphans = await prisma.$queryRaw`SELECT COUNT(*) as c FROM Cart c LEFT JOIN User u ON c.userId = u.id WHERE u.id IS NULL`;
    const mappable = await prisma.$queryRaw`SELECT COUNT(*) as c FROM Cart c JOIN User u ON c.userId = u.googleId LEFT JOIN User u2 ON u2.id = c.userId WHERE u2.id IS NULL`;
    
    diagData.total_orphans = Number(orphans[0].c);
    diagData.google_mappable_orphans = Number(mappable[0].c);

    // 3. FK Info
    const fkInfo = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Cart'
        AND COLUMN_NAME = 'userId'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    diagData.fkInfo = fkInfo;

    // Resolve failed migration if needed
    const failed150000 = history.find(h => h.migration_name === '20260927150000_repair_cart_user_foreign_key' && !h.finished_at);
    if (failed150000) {
        console.log("Migration 150000 is in FAILED state. Resolving as rolled-back...");
        execSync('npx prisma migrate resolve --rolled-back 20260927150000_repair_cart_user_foreign_key', { stdio: 'inherit' });
        diagData.resolved = true;
    }

    // Write to public for fetching
    fs.writeFileSync(path.join(__dirname, '../public/diag.json'), JSON.stringify(diagData, null, 2));

  } catch (err) {
    console.error("Diagnosis error:", err);
    diagData.error = err.message;
    fs.writeFileSync(path.join(__dirname, '../public/diag.json'), JSON.stringify(diagData, null, 2));
  } finally {
    await prisma.$disconnect();
  }

  console.log("Running prisma migrate deploy...");
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log("=== DONE ===");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
