CREATE TABLE `maintenance_events` (
	`id` varchar(36) NOT NULL,
	`eventType` enum('SCHEDULED','STARTED','ENDED','CANCELLED','UPDATED') NOT NULL,
	`mode` enum('CLOSED','CATALOG_ONLY') NOT NULL,
	`message` varchar(280) NOT NULL,
	`reason` varchar(280),
	`scheduledStartAt` timestamp,
	`scheduledEndAt` timestamp,
	`actorId` varchar(160),
	`actorType` enum('admin','scheduler') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `discord_notifications` MODIFY COLUMN `eventType` enum('PAYMENT_APPROVED','DELIVERY_COMPLETED','DELIVERY_FAILED','STORE_MAINTENANCE_STARTED','STORE_MAINTENANCE_ENDED') NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `maintenanceMode` enum('CLOSED','CATALOG_ONLY') DEFAULT 'CLOSED' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `maintenanceReason` varchar(280);--> statement-breakpoint
ALTER TABLE `store_settings` ADD `scheduledStartAt` timestamp;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `scheduledEndAt` timestamp;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `scheduleStatus` enum('NONE','SCHEDULED','ACTIVE','COMPLETED','CANCELLED') DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `scheduleStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `scheduleEndedAt` timestamp;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
CREATE INDEX `maintenance_events_created_idx` ON `maintenance_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `store_settings_schedule_idx` ON `store_settings` (`scheduleStatus`,`scheduledStartAt`);
