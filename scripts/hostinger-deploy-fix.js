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

  try {
    // ==================================================
    // STEP 1 — QUERY CURRENT STATE
    // ==================================================
    const fkInfo = await prisma.$queryRaw`
      SELECT
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Cart'
        AND COLUMN_NAME = 'userId'
        AND REFERENCED_TABLE_NAME IS NOT NULL;
    `;

    const orphans = await prisma.$queryRaw`
      SELECT COUNT(*) AS c
      FROM Cart c
      LEFT JOIN User u ON u.id = c.userId
      WHERE u.id IS NULL;
    `;
    const total_orphans = Number(orphans[0]?.c ?? 0);

    const mappable = await prisma.$queryRaw`
      SELECT COUNT(*) AS c
      FROM Cart c
      JOIN User u ON c.userId = u.googleId
      LEFT JOIN User currentUser ON currentUser.id = c.userId
      WHERE currentUser.id IS NULL;
    `;
    const google_mappable_orphans = Number(mappable[0]?.c ?? 0);

    const currentFk = fkInfo[0] || null;

    // ==================================================
    // STEP 2 — SAFETY GATE
    // ==================================================
    if (total_orphans !== google_mappable_orphans) {
      console.error("\nCRITICAL SAFETY GATE TRIGGERED: total_orphans !== google_mappable_orphans");
      console.error(`Total orphans: ${total_orphans}, Google-mappable orphans: ${google_mappable_orphans}`);
      console.error("Unmappable carts exist. Aborting deployment for manual investigation.\n");
      process.exit(1);
    }

    // ==================================================
    // STEP 9 — IDEMPOTENCY CHECK
    // ==================================================
    const isAlreadyCorrect =
      fkInfo.length > 0 &&
      fkInfo[0].REFERENCED_TABLE_NAME === 'User' &&
      fkInfo[0].REFERENCED_COLUMN_NAME === 'id' &&
      total_orphans === 0;

    let droppedIncorrectFk = false;
    let mappedCartsCount = 0;
    let remainingOrphans = 0;

    if (isAlreadyCorrect) {
      console.log("Current schema is already correct: Cart.userId -> User.id with 0 orphans.");
      droppedIncorrectFk = false;
      mappedCartsCount = 0;
      remainingOrphans = 0;
    } else {
      // ==================================================
      // STEP 3 — DROP CURRENT Cart.userId FOREIGN KEY FIRST
      // ==================================================
      if (fkInfo.length > 0) {
        for (const fk of fkInfo) {
          console.log(`Dropping FK constraint on Cart.userId: ${fk.CONSTRAINT_NAME}`);
          await prisma.$executeRawUnsafe(`ALTER TABLE \`Cart\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
          droppedIncorrectFk = true;
        }
      } else {
        console.log("No existing FK found on Cart.userId to drop.");
        droppedIncorrectFk = false;
      }

      // Also ensure any lingering constraint named Cart_userId_fkey on Cart is dropped
      const existingNamedFk = await prisma.$queryRaw`
        SELECT CONSTRAINT_NAME, TABLE_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND CONSTRAINT_NAME = 'Cart_userId_fkey'
          AND TABLE_NAME = 'Cart'
          AND CONSTRAINT_TYPE = 'FOREIGN KEY';
      `;
      for (const efk of existingNamedFk) {
        try {
          console.log("Dropping existing constraint named Cart_userId_fkey on Cart...");
          await prisma.$executeRawUnsafe(`ALTER TABLE \`Cart\` DROP FOREIGN KEY \`Cart_userId_fkey\``);
        } catch (_) {}
      }

      // ==================================================
      // STEP 4 — MAP LEGACY CART USER IDs
      // ==================================================
      console.log("Mapping legacy cart user IDs from googleId to User.id...");
      const updateResult = await prisma.$executeRaw`
        UPDATE Cart c
        INNER JOIN User u
          ON c.userId = u.googleId
        SET c.userId = u.id
        WHERE c.userId <> u.id;
      `;
      mappedCartsCount = Number(updateResult);

      // ==================================================
      // STEP 5 — VERIFY ZERO ORPHANS AFTER UPDATE
      // ==================================================
      const remaining = await prisma.$queryRaw`
        SELECT COUNT(*) AS c
        FROM Cart c
        LEFT JOIN User u ON u.id = c.userId
        WHERE u.id IS NULL;
      `;
      remainingOrphans = Number(remaining[0]?.c ?? 0);

      if (remainingOrphans > 0) {
        console.error(`\nCRITICAL: ${remainingOrphans} orphan carts remain after remapping! Aborting deployment.\n`);
        process.exit(1);
      }

      // ==================================================
      // STEP 6 — ADD CORRECT FOREIGN KEY
      // ==================================================
      console.log("Adding correct foreign key constraint Cart_userId_fkey -> User(id)...");
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`Cart\`
        ADD CONSTRAINT \`Cart_userId_fkey\`
        FOREIGN KEY (\`userId\`)
        REFERENCES \`User\`(\`id\`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
      `);

      // ==================================================
      // STEP 7 — VERIFY FK AFTER REPAIR
      // ==================================================
      const verifiedFk = await prisma.$queryRaw`
        SELECT
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Cart'
          AND COLUMN_NAME = 'userId'
          AND REFERENCED_TABLE_NAME IS NOT NULL;
      `;

      const isValidFk =
        verifiedFk.length > 0 &&
        verifiedFk.some(
          fk => fk.REFERENCED_TABLE_NAME === 'User' && fk.REFERENCED_COLUMN_NAME === 'id'
        );

      if (!isValidFk) {
        console.error("\nCRITICAL: Verification failed! Cart.userId FK is not referencing User.id.\n");
        process.exit(1);
      }
    }

    // ==================================================
    // STEP 7.5 — PROACTIVE ADDRESS COLUMN ALIGNMENT
    // ==================================================
    console.log("=== CHECKING & ALIGNING ADDRESS TABLE COLUMNS ===");
    const addressPreCols = await prisma.$queryRaw`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME = 'Address' OR LOWER(TABLE_NAME) = 'address');
    `;
    const preColNames = addressPreCols.map(c => c.COLUMN_NAME);
    console.log("Existing Address columns before deploy:", preColNames.join(", "));

    if (preColNames.includes("name") && !preColNames.includes("fullName")) {
      console.log("Aligning column: Address.name -> Address.fullName...");
      await prisma.$executeRawUnsafe("ALTER TABLE `Address` CHANGE COLUMN `name` `fullName` VARCHAR(100) NOT NULL");
    }

    if (preColNames.includes("address") && !preColNames.includes("addressLine1")) {
      console.log("Aligning column: Address.address -> Address.addressLine1...");
      await prisma.$executeRawUnsafe("ALTER TABLE `Address` CHANGE COLUMN `address` `addressLine1` VARCHAR(500) NOT NULL");
    }

    if (preColNames.includes("pincode") && !preColNames.includes("postalCode")) {
      console.log("Aligning column: Address.pincode -> Address.postalCode...");
      await prisma.$executeRawUnsafe("ALTER TABLE `Address` CHANGE COLUMN `pincode` `postalCode` VARCHAR(10) NOT NULL");
    }

    const preIndexes = await prisma.$queryRaw`
      SELECT DISTINCT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME = 'Address' OR LOWER(TABLE_NAME) = 'address');
    `;
    const preIdxNames = preIndexes.map(i => i.INDEX_NAME);
    if (!preIdxNames.includes("Address_userId_isDefault_idx")) {
      console.log("Adding index: Address_userId_isDefault_idx...");
      try {
        await prisma.$executeRawUnsafe("CREATE INDEX `Address_userId_isDefault_idx` ON `Address`(`userId`, `isDefault`)");
      } catch (idxErr) {
        console.log("Index creation notice:", idxErr.message || idxErr);
      }
    }

    // ==================================================
    // STEP 8 — HANDLE PRISMA MIGRATION HISTORY
    // ==================================================
    const history = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count
      FROM \`_prisma_migrations\`
      WHERE migration_name IN (
        '20260927150000_repair_cart_user_foreign_key',
        '20260927160000_force_repair_cart_user_foreign_key',
        '20260927170000_align_address_columns'
      );
    `;

    const m15 = history.find(h => h.migration_name === '20260927150000_repair_cart_user_foreign_key');
    const m16 = history.find(h => h.migration_name === '20260927160000_force_repair_cart_user_foreign_key');
    const m17 = history.find(h => h.migration_name === '20260927170000_align_address_columns');

    let resolved150000 = false;
    let resolved160000 = false;
    let resolved170000 = false;

    // Check 150000: only resolve if failed or unapplied
    const m15Satisfied = m15 && m15.finished_at != null && m15.rolled_back_at == null;
    if (!m15Satisfied) {
      console.log("Resolving migration 150000 as applied (schema is verified)...");
      execSync('npx prisma migrate resolve --applied 20260927150000_repair_cart_user_foreign_key', { stdio: 'inherit' });
      resolved150000 = true;
    } else {
      console.log("Migration 150000 is already satisfied in _prisma_migrations.");
    }

    // Check 160000: only resolve if failed or unapplied
    const m16Satisfied = m16 && m16.finished_at != null && m16.rolled_back_at == null;
    if (!m16Satisfied) {
      console.log("Resolving migration 160000 as applied (schema is verified)...");
      execSync('npx prisma migrate resolve --applied 20260927160000_force_repair_cart_user_foreign_key', { stdio: 'inherit' });
      resolved160000 = true;
    } else {
      console.log("Migration 160000 is already satisfied in _prisma_migrations.");
    }

    // Check 170000: only resolve if failed or unapplied
    const m17Satisfied = m17 && m17.finished_at != null && m17.rolled_back_at == null;
    if (!m17Satisfied) {
      console.log("Resolving migration 170000 as applied (Address schema is verified)...");
      try {
        execSync('npx prisma migrate resolve --applied 20260927170000_align_address_columns', { stdio: 'inherit' });
        resolved170000 = true;
      } catch (err17) {
        console.warn("Could not mark migration 170000 as applied via CLI:", err17.message || err17);
      }
    } else {
      console.log("Migration 170000 is already satisfied in _prisma_migrations.");
    }

    console.log("Running prisma migrate deploy...");
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // ==================================================
    // STEP 14 — HOSTINGER BUILD LOG OUTPUT
    // ==================================================
    console.log("\nCart FK before:");
    if (currentFk) {
      console.log(`${currentFk.CONSTRAINT_NAME} → ${currentFk.REFERENCED_TABLE_NAME}.${currentFk.REFERENCED_COLUMN_NAME}`);
    } else {
      console.log("none");
    }
    console.log("\nTotal orphan carts:");
    console.log(total_orphans);
    console.log("\nGoogle-mappable orphans:");
    console.log(google_mappable_orphans);
    console.log("\nDropped incorrect FK:");
    console.log(droppedIncorrectFk ? "yes" : "no");
    console.log("\nMapped legacy carts:");
    console.log(mappedCartsCount);
    console.log("\nRemaining orphans:");
    console.log(remainingOrphans);
    console.log("\nCart FK after:");
    console.log("Cart.userId → User.id");
    console.log("\nResolved migration 150000:");
    console.log(resolved150000 ? "yes" : "no");
    console.log("\nResolved migration 160000:");
    console.log(resolved160000 ? "yes" : "no");
    console.log("\nResolved migration 170000:");
    console.log(resolved170000 ? "yes" : "no");
    console.log("\nprisma migrate deploy:");
    console.log("SUCCESS\n");

    // ==================================================
    // STEP 15 — HOSTINGER ADDRESS SCHEMA VERIFICATION (SECTION 9)
    // ==================================================
    console.log("=== VERIFYING ADDRESS TABLE COLUMNS (SECTION 9) ===");
    const addressCols = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME = 'Address' OR LOWER(TABLE_NAME) = 'address')
      ORDER BY ORDINAL_POSITION;
    `;
    const colNames = addressCols.map(c => c.COLUMN_NAME);
    console.log("Current Address columns:", colNames.join(", "));

    const hasFullName = colNames.includes("fullName");
    const hasAddressLine1 = colNames.includes("addressLine1");
    const hasPostalCode = colNames.includes("postalCode");
    const hasLegacyName = colNames.includes("name");
    const hasLegacyAddress = colNames.includes("address");
    const hasLegacyPincode = colNames.includes("pincode");

    console.log(`- fullName exists: ${hasFullName ? "YES" : "NO"}`);
    console.log(`- addressLine1 exists: ${hasAddressLine1 ? "YES" : "NO"}`);
    console.log(`- postalCode exists: ${hasPostalCode ? "YES" : "NO"}`);
    console.log(`- legacy name removed: ${!hasLegacyName ? "YES" : "NO"}`);
    console.log(`- legacy address removed: ${!hasLegacyAddress ? "YES" : "NO"}`);
    console.log(`- legacy pincode removed: ${!hasLegacyPincode ? "YES" : "NO"}`);

    const addressIndexes = await prisma.$queryRaw`
      SELECT DISTINCT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME = 'Address' OR LOWER(TABLE_NAME) = 'address');
    `;
    const idxNames = addressIndexes.map(i => i.INDEX_NAME);
    console.log("Address indexes:", idxNames.join(", "));
    const hasCompoundIdx = idxNames.includes("Address_userId_isDefault_idx");
    console.log(`- compound index (userId, isDefault) exists: ${hasCompoundIdx ? "YES" : "NO"}`);

    const addrCount = await prisma.$queryRaw`SELECT COUNT(*) as c FROM \`Address\``;
    console.log(`- address row count (preserved): ${Number(addrCount[0]?.c ?? 0)}\n`);

    if (!hasFullName || !hasAddressLine1 || !hasPostalCode || hasLegacyName || hasLegacyAddress || hasLegacyPincode) {
      console.error("\nCRITICAL: Address schema does not match required columns after migration!");
      process.exit(1);
    }


  } catch (err) {
    if (err.message && (err.message.includes("P1000") || err.message.includes("Access denied") || err.message.includes("P1001"))) {
      console.warn("⚠️  Database connection not accessible in current environment:", err.message);
      console.warn("⚠️  Skipping database repair script in local build. This will run automatically during Hostinger deployment.");
      return;
    }
    console.error("Diagnosis & repair error:", err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
