CREATE TABLE `community_status` (
	`id` int NOT NULL,
	`discordGuildId` varchar(32),
	`discordName` varchar(100),
	`discordIconUrl` varchar(1024),
	`discordInviteUrl` varchar(512),
	`discordMemberCount` int,
	`discordOnlineCount` int,
	`discordOnline` boolean NOT NULL DEFAULT false,
	`minecraftStatus` enum('UNKNOWN','ONLINE','OFFLINE','MAINTENANCE') NOT NULL DEFAULT 'UNKNOWN',
	`minecraftPlayersOnline` int,
	`minecraftPlayersMax` int,
	`minecraftMotd` varchar(280),
	`minecraftVersion` varchar(96),
	`sourceUpdatedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_status_id` PRIMARY KEY(`id`)
);
