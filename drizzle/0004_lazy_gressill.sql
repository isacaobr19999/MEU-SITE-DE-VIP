CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`kind` enum('RULE','NEWS') NOT NULL,
	`title` varchar(160) NOT NULL,
	`summary` varchar(280),
	`body` text NOT NULL,
	`published` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `community_posts_public_idx` ON `community_posts` (`kind`,`published`,`position`,`publishedAt`);