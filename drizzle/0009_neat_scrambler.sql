CREATE TABLE `store_settings` (
	`id` int NOT NULL,
	`publicOnline` boolean NOT NULL DEFAULT true,
	`offlineMessage` varchar(280) NOT NULL DEFAULT 'A loja está temporariamente em manutenção. Volte em breve.',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_settings_id` PRIMARY KEY(`id`)
);
