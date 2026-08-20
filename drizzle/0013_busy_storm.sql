CREATE TABLE `login_attempts` (
	`id` varchar(36) NOT NULL,
	`userId` int,
	`emailHint` varchar(96) NOT NULL,
	`outcome` enum('SUCCESS','FAILED') NOT NULL,
	`method` enum('PASSWORD') NOT NULL DEFAULT 'PASSWORD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `login_attempts` ADD CONSTRAINT `login_attempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `login_attempts_created_idx` ON `login_attempts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `login_attempts_user_created_idx` ON `login_attempts` (`userId`,`createdAt`);