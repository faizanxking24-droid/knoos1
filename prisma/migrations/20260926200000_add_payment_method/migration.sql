-- AlterTable Order: Add paymentMethod column with default 'ONLINE'
ALTER TABLE `Order` ADD COLUMN `paymentMethod` VARCHAR(20) NOT NULL DEFAULT 'ONLINE';
