-- Migration: 20260927170000_align_address_columns
-- Corrective migration to align Address table columns with Prisma Address model:
--   - Address.name -> Address.fullName VARCHAR(100) NOT NULL
--   - Address.address -> Address.addressLine1 VARCHAR(500) NOT NULL
--   - Address.pincode -> Address.postalCode VARCHAR(10) NOT NULL
--   - Add compound index Address_userId_isDefault_idx ON Address(userId, isDefault) if not present
-- Preserves all existing data. Does not touch OrderAddress.
-- Guarded against schema drift and idempotent across multiple environments.

-- ==================================================
-- 1. Align Address.name -> Address.fullName
-- ==================================================
SET @old_name_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Address'
      AND COLUMN_NAME = 'name'
);

SET @new_name_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Address'
      AND COLUMN_NAME = 'fullName'
);

SET @sql_name = CASE
    WHEN @old_name_exists > 0 AND @new_name_exists > 0 THEN
        'SELECT * FROM `SCHEMA_CONFLICT: Both Address.name and Address.fullName exist in database. Aborting to prevent data loss.`'
    WHEN @old_name_exists > 0 AND @new_name_exists = 0 THEN
        'ALTER TABLE `Address` CHANGE COLUMN `name` `fullName` VARCHAR(100) NOT NULL'
    ELSE
        'SELECT 1'
END;

PREPARE stmt_name FROM @sql_name;
EXECUTE stmt_name;
DEALLOCATE PREPARE stmt_name;

-- ==================================================
-- 2. Align Address.address -> Address.addressLine1
-- ==================================================
SET @old_address_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Address'
      AND COLUMN_NAME = 'address'
);

SET @new_address_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Address'
      AND COLUMN_NAME = 'addressLine1'
);

SET @sql_address = CASE
    WHEN @old_address_exists > 0 AND @new_address_exists > 0 THEN
        'SELECT * FROM `SCHEMA_CONFLICT: Both Address.address and Address.addressLine1 exist in database. Aborting to prevent data loss.`'
    WHEN @old_address_exists > 0 AND @new_address_exists = 0 THEN
        'ALTER TABLE `Address` CHANGE COLUMN `address` `addressLine1` VARCHAR(500) NOT NULL'
    ELSE
        'SELECT 1'
END;

PREPARE stmt_address FROM @sql_address;
EXECUTE stmt_address;
DEALLOCATE PREPARE stmt_address;

-- ==================================================
-- 3. Align Address.pincode -> Address.postalCode
-- ==================================================
SET @old_pincode_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Address'
      AND COLUMN_NAME = 'pincode'
);

SET @new_pincode_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Address'
      AND COLUMN_NAME = 'postalCode'
);

SET @sql_pincode = CASE
    WHEN @old_pincode_exists > 0 AND @new_pincode_exists > 0 THEN
        'SELECT * FROM `SCHEMA_CONFLICT: Both Address.pincode and Address.postalCode exist in database. Aborting to prevent data loss.`'
    WHEN @old_pincode_exists > 0 AND @new_pincode_exists = 0 THEN
        'ALTER TABLE `Address` CHANGE COLUMN `pincode` `postalCode` VARCHAR(10) NOT NULL'
    ELSE
        'SELECT 1'
END;

PREPARE stmt_pincode FROM @sql_pincode;
EXECUTE stmt_pincode;
DEALLOCATE PREPARE stmt_pincode;

-- ==================================================
-- 4. Align Compound Index: (userId, isDefault)
-- ==================================================
SET @compound_idx_exists = (
    SELECT COUNT(DISTINCT s1.INDEX_NAME)
    FROM information_schema.STATISTICS s1
    JOIN information_schema.STATISTICS s2
      ON s1.TABLE_SCHEMA = s2.TABLE_SCHEMA
     AND s1.TABLE_NAME = s2.TABLE_NAME
     AND s1.INDEX_NAME = s2.INDEX_NAME
    WHERE s1.TABLE_SCHEMA = DATABASE()
      AND s1.TABLE_NAME = 'Address'
      AND s1.COLUMN_NAME = 'userId'
      AND s1.SEQ_IN_INDEX = 1
      AND s2.COLUMN_NAME = 'isDefault'
      AND s2.SEQ_IN_INDEX = 2
);

SET @named_idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Address'
      AND INDEX_NAME = 'Address_userId_isDefault_idx'
);

SET @sql_idx = IF(
    @compound_idx_exists = 0 AND @named_idx_exists = 0,
    'CREATE INDEX `Address_userId_isDefault_idx` ON `Address`(`userId`, `isDefault`)',
    'SELECT 1'
);

PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
