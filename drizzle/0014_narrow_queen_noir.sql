CREATE TABLE `login_lockouts` (
	`emailHash` varchar(64) NOT NULL,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`windowStartedAt` timestamp NOT NULL DEFAULT (now()),
	`lockedUntil` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `login_lockouts_emailHash` PRIMARY KEY(`emailHash`)
);
--> statement-breakpoint
ALTER TABLE `discord_notifications` MODIFY COLUMN `eventType` enum('PAYMENT_APPROVED','DELIVERY_COMPLETED','DELIVERY_FAILED','LOGIN_SECURITY_ALERT','STORE_MAINTENANCE_STARTED','STORE_MAINTENANCE_ENDED','STORE_MAINTENANCE_TEST') NOT NULL;--> statement-breakpoint
CREATE INDEX `login_lockouts_locked_idx` ON `login_lockouts` (`lockedUntil`);