-- AlterTable OrderItem: Add nullable sku column for historical product variant SKU snapshot
ALTER TABLE `OrderItem` ADD COLUMN `sku` VARCHAR(100) NULL;
