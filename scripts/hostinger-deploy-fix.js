const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function stringifySafe(value) {
  return JSON.stringify(
    value,
    (_key, val) => typeof val === "bigint" ? Number(val) : val,
    2
  );
}

async function main() {
  console.log("=== STARTING HOSTINGER DB DIAGNOSIS & REPAIR ===");
  
  const diagData = {};
  let abortDeployment = false;

  try {
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
      applied_steps_count: r.applied_steps_count == null ? null : Number(r.applied_steps_count)
    }));

    const orphans = await prisma.$queryRaw`SELECT COUNT(*) as c FROM Cart c LEFT JOIN User u ON c.userId = u.id WHERE u.id IS NULL`;
    const mappable = await prisma.$queryRaw`SELECT COUNT(*) as c FROM Cart c JOIN User u ON c.userId = u.googleId LEFT JOIN User u2 ON u2.id = c.userId WHERE u2.id IS NULL`;
    
    diagData.total_orphans = Number(orphans[0].c);
    diagData.google_mappable_orphans = Number(mappable[0].c);

    const fkInfo = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Cart'
        AND COLUMN_NAME = 'userId'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    diagData.fkInfo = fkInfo;

    if (diagData.total_orphans !== diagData.google_mappable_orphans) {
      console.error(`\nCRITICAL: Unmappable orphans found! Total: ${diagData.total_orphans}, Mappable: ${diagData.google_mappable_orphans}`);
      console.error("Aborting deployment to prevent destructive action or migration failure.");
      abortDeployment = true;
    } else {
      const failed150000 = history.find(h => h.migration_name === '20260927150000_repair_cart_user_foreign_key' && !h.finished_at);
      if (failed150000) {
          console.log("Migration 150000 is in FAILED state. Resolving as applied so we can run the robust 160000 migration...");
          execSync('npx prisma migrate resolve --applied 20260927150000_repair_cart_user_foreign_key', { stdio: 'inherit' });
          diagData.resolved = true;
      }
    }

    console.log("Diagnostic Summary:");
    console.log(stringifySafe(diagData));

  } catch (err) {
    console.error("Diagnosis error:", err);
    diagData.error = err.message;
    console.log("Diagnostic Error Summary:");
    console.log(stringifySafe(diagData));
    abortDeployment = true;
  } finally {
    await prisma.$disconnect();
  }

  if (abortDeployment) {
    process.exit(1);
  }

  console.log("Running prisma migrate deploy...");
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log("=== DONE ===");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
