CREATE TABLE `discord_notifications` (
	`id` varchar(36) NOT NULL,
	`eventType` enum('PAYMENT_APPROVED','DELIVERY_COMPLETED','DELIVERY_FAILED') NOT NULL,
	`status` enum('PENDING','SENT') NOT NULL DEFAULT 'PENDING',
	`orderId` varchar(36),
	`deliveryId` varchar(36),
	`dedupeKey` varchar(128) NOT NULL,
	`payload` json NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discord_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `discord_notifications_dedupe_unique` UNIQUE(`dedupeKey`)
);
--> statement-breakpoint
ALTER TABLE `community_status` ADD `minecraftTpsMilli` int;--> statement-breakpoint
ALTER TABLE `community_status` ADD `minecraftMsptMicros` int;--> statement-breakpoint
ALTER TABLE `discord_notifications` ADD CONSTRAINT `discord_notifications_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discord_notifications` ADD CONSTRAINT `discord_notifications_deliveryId_deliveries_id_fk` FOREIGN KEY (`deliveryId`) REFERENCES `deliveries`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `discord_notifications_status_created_idx` ON `discord_notifications` (`status`,`createdAt`);