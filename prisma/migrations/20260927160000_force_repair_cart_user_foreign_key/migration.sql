-- Fix orphan Carts by mapping Google Auth IDs to actual User CUIDs
UPDATE `Cart` c
INNER JOIN `User` u ON c.userId = u.googleId
SET c.userId = u.id
WHERE c.userId != u.id;

-- Dynamically find and drop the existing constraint on Cart.userId, regardless of its name
-- (e.g. if it was named cart_ibfk_1 or if the previous migration failed midway)
SET @fk_name = (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Cart'
      AND COLUMN_NAME = 'userId'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);

SET @s = IF(@fk_name IS NOT NULL, CONCAT('ALTER TABLE `Cart` DROP FOREIGN KEY `', @fk_name, '`'), 'SELECT 1');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Safely add the correct constraint now that orphans are resolved
ALTER TABLE `Cart`
  ADD CONSTRAINT `Cart_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
