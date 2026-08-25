CREATE TABLE `integration_events` (
	`id` varchar(64) NOT NULL,
	`idempotencyKey` varchar(128) NOT NULL,
	`type` varchar(96) NOT NULL,
	`origin` varchar(32) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('RECEIVED','PROCESSED','FAILED') NOT NULL DEFAULT 'RECEIVED',
	`failureReason` varchar(255),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_events_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE INDEX `integration_events_type_status_idx` ON `integration_events` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `integration_events_created_idx` ON `integration_events` (`createdAt`);