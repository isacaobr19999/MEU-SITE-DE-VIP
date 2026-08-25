CREATE TABLE `discord_accounts` (
		`id` int AUTO_INCREMENT NOT NULL,
		`discordUserId` varchar(32) NOT NULL,
		`globalName` varchar(128),
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `discord_accounts_id` PRIMARY KEY(`id`),
		CONSTRAINT `discord_accounts_discordUserId_unique` UNIQUE(`discordUserId`),
		CONSTRAINT `discord_accounts_user_id_unique` UNIQUE(`discordUserId`)
);
--> statement-breakpoint
CREATE TABLE `minecraft_link_codes` (
		`code` varchar(6) NOT NULL,
		`playerId` int NOT NULL,
		`target` enum('DISCORD','SITE') NOT NULL DEFAULT 'DISCORD',
		`expiresAt` timestamp NOT NULL,
		`usedAt` timestamp,
		`discordAccountId` int,
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		CONSTRAINT `minecraft_link_codes_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `player_discord_links` (
		`id` int AUTO_INCREMENT NOT NULL,
		`playerId` int NOT NULL,
		`discordAccountId` int NOT NULL,
		`linkedAt` timestamp NOT NULL DEFAULT (now()),
		`unlinkedAt` timestamp,
		CONSTRAINT `player_discord_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `minecraft_link_codes` ADD CONSTRAINT `minecraft_link_codes_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `minecraft_link_codes` ADD CONSTRAINT `minecraft_link_codes_discordAccountId_discord_accounts_id_fk` FOREIGN KEY (`discordAccountId`) REFERENCES `discord_accounts`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `player_discord_links` ADD CONSTRAINT `player_discord_links_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `player_discord_links` ADD CONSTRAINT `player_discord_links_discordAccountId_discord_accounts_id_fk` FOREIGN KEY (`discordAccountId`) REFERENCES `discord_accounts`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `minecraft_link_codes_expiry_idx` ON `minecraft_link_codes` (`expiresAt`,`usedAt`);
--> statement-breakpoint
CREATE INDEX `minecraft_link_codes_player_idx` ON `minecraft_link_codes` (`playerId`,`usedAt`);
--> statement-breakpoint
CREATE INDEX `player_discord_links_player_idx` ON `player_discord_links` (`playerId`,`unlinkedAt`);
--> statement-breakpoint
CREATE INDEX `player_discord_links_discord_idx` ON `player_discord_links` (`discordAccountId`,`unlinkedAt`);
