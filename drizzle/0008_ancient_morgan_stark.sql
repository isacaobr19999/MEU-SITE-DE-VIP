ALTER TABLE `coupons` ADD `archivedAt` timestamp;--> statement-breakpoint
CREATE INDEX `coupons_archived_idx` ON `coupons` (`archivedAt`);