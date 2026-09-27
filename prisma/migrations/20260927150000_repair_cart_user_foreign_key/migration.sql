-- Repair a production schema drift where Cart.userId was constrained against
-- an outdated User reference. This preserves every cart and cart item; only
-- the foreign-key definition is recreated against the current User.id.
ALTER TABLE `Cart` DROP FOREIGN KEY `Cart_userId_fkey`;

ALTER TABLE `Cart`
  ADD CONSTRAINT `Cart_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
