CREATE TABLE `monitoring_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`status` enum('ONLINE','DEGRADED','OFFLINE') NOT NULL,
	`latencyMs` int,
	`message` varchar(280),
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monitoring_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`status` enum('OPEN','RESOLVED') NOT NULL DEFAULT 'OPEN',
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`lastMessage` varchar(280),
	`notificationKey` varchar(160) NOT NULL,
	CONSTRAINT `monitoring_incidents_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_incidents_notification_unique` UNIQUE(`notificationKey`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(48) NOT NULL,
	`label` varchar(96) NOT NULL,
	`kind` enum('STORE','API','DISCORD','MINECRAFT') NOT NULL,
	`endpoint` varchar(512),
	`active` boolean NOT NULL DEFAULT true,
	`currentStatus` enum('UNKNOWN','ONLINE','DEGRADED','OFFLINE') NOT NULL DEFAULT 'UNKNOWN',
	`lastCheckedAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastFailureAt` timestamp,
	`lastLatencyMs` int,
	`lastMessage` varchar(280),
	`consecutiveFailures` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_services_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_services_key_unique` UNIQUE(`serviceKey`)
);
--> statement-breakpoint
ALTER TABLE `monitoring_checks` ADD CONSTRAINT `monitoring_checks_serviceId_monitoring_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `monitoring_services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_incidents` ADD CONSTRAINT `monitoring_incidents_serviceId_monitoring_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `monitoring_services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `monitoring_checks_service_time_idx` ON `monitoring_checks` (`serviceId`,`checkedAt`);--> statement-breakpoint
CREATE INDEX `monitoring_incidents_service_status_idx` ON `monitoring_incidents` (`serviceId`,`status`,`openedAt`);--> statement-breakpoint
CREATE INDEX `monitoring_services_status_idx` ON `monitoring_services` (`currentStatus`,`active`);