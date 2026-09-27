-- AlterTable OrderItem: Add nullable unitCostPaise column for forward-looking cost snapshot
ALTER TABLE `OrderItem` ADD COLUMN `unitCostPaise` INTEGER NULL;
