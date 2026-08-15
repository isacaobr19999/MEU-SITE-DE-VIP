CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permissions` json NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(96) NOT NULL,
	`slug` varchar(96) NOT NULL,
	`description` text,
	`imageUrl` varchar(1024),
	`position` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `coupon_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`productId` int NOT NULL,
	CONSTRAINT `coupon_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupon_products_pair_unique` UNIQUE(`couponId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `coupon_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`playerId` int NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`discountCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupon_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupon_usage_order_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(48) NOT NULL,
	`description` varchar(280),
	`type` enum('PERCENTAGE','FIXED') NOT NULL,
	`percentageBasisPoints` int,
	`fixedDiscountCents` int,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`maxUses` int,
	`maxUsesPerPlayer` int NOT NULL DEFAULT 1,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` varchar(36) NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`orderItemId` int NOT NULL,
	`playerId` int NOT NULL,
	`serverId` int NOT NULL,
	`status` enum('PENDING','CLAIMED','PROCESSING','COMPLETED','RETRYING','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`commandTemplates` json NOT NULL,
	`attemptCount` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 8,
	`claimedByServerId` int,
	`claimTokenHash` varchar(255),
	`claimExpiresAt` timestamp,
	`nextAttemptAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`lastError` text,
	`idempotencyKey` varchar(96) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorType` enum('admin','customer','gateway','server','system') NOT NULL,
	`actorId` varchar(160),
	`action` varchar(128) NOT NULL,
	`entityType` varchar(96) NOT NULL,
	`entityId` varchar(160),
	`ipHash` varchar(128),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`productId` int NOT NULL,
	`serverId` int NOT NULL,
	`productName` varchar(160) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPriceCents` int NOT NULL,
	`durationDays` int,
	`deliveryCommands` json NOT NULL,
	`luckPermsGroup` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`orderNumber` varchar(24) NOT NULL,
	`userId` int,
	`playerId` int NOT NULL,
	`couponId` int,
	`status` enum('PENDING','WAITING_PAYMENT','PAID','PROCESSING','COMPLETED','CANCELLED','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING',
	`subtotalCents` int NOT NULL,
	`discountCents` int NOT NULL DEFAULT 0,
	`totalCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`idempotencyKey` varchar(96) NOT NULL,
	`placedAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	`completedAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_unique` UNIQUE(`orderNumber`),
	CONSTRAINT `orders_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`provider` varchar(48) NOT NULL,
	`providerPaymentId` varchar(160),
	`providerEventId` varchar(160),
	`method` enum('PIX','CARD','OTHER') NOT NULL,
	`status` enum('PENDING','PROCESSING','APPROVED','REJECTED','CANCELLED','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING',
	`amountCents` int NOT NULL,
	`idempotencyKey` varchar(96) NOT NULL,
	`gatewayPayload` json,
	`authorizedAt` timestamp,
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_idempotency_unique` UNIQUE(`idempotencyKey`),
	CONSTRAINT `payments_provider_event_unique` UNIQUE(`provider`,`providerEventId`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`username` varchar(16) NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`email` varchar(320),
	`lastSeenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`),
	CONSTRAINT `players_username_unique` UNIQUE(`username`),
	CONSTRAINT `players_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `product_servers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`serverId` int NOT NULL,
	CONSTRAINT `product_servers_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_servers_pair_unique` UNIQUE(`productId`,`serverId`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`shortDescription` varchar(280),
	`description` text,
	`kind` enum('VIP','COINS','KIT','COSMETIC') NOT NULL,
	`imageUrl` varchar(1024),
	`priceCents` int NOT NULL,
	`durationDays` int,
	`luckPermsGroup` varchar(96),
	`deliveryCommands` json NOT NULL,
	`featured` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(96) NOT NULL,
	`slug` varchar(48) NOT NULL,
	`kind` enum('SURVIVAL','SKYBLOCK','BEDWARS','GLOBAL') NOT NULL,
	`apiKeyHash` varchar(255) NOT NULL,
	`apiKeyLastFour` varchar(4) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servers_id` PRIMARY KEY(`id`),
	CONSTRAINT `servers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `vip_grants` (
	`id` varchar(36) NOT NULL,
	`playerId` int NOT NULL,
	`productId` int NOT NULL,
	`serverId` int NOT NULL,
	`groupName` varchar(96) NOT NULL,
	`grantedByDeliveryId` varchar(36) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vip_grants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_products` ADD CONSTRAINT `coupon_products_couponId_coupons_id_fk` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_products` ADD CONSTRAINT `coupon_products_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_usage` ADD CONSTRAINT `coupon_usage_couponId_coupons_id_fk` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_usage` ADD CONSTRAINT `coupon_usage_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_usage` ADD CONSTRAINT `coupon_usage_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_orderItemId_order_items_id_fk` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_claimedByServerId_servers_id_fk` FOREIGN KEY (`claimedByServerId`) REFERENCES `servers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_couponId_coupons_id_fk` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_servers` ADD CONSTRAINT `product_servers_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_servers` ADD CONSTRAINT `product_servers_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vip_grants` ADD CONSTRAINT `vip_grants_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vip_grants` ADD CONSTRAINT `vip_grants_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vip_grants` ADD CONSTRAINT `vip_grants_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vip_grants` ADD CONSTRAINT `vip_grants_grantedByDeliveryId_deliveries_id_fk` FOREIGN KEY (`grantedByDeliveryId`) REFERENCES `deliveries`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_users_active_idx` ON `admin_users` (`active`);--> statement-breakpoint
CREATE INDEX `categories_active_position_idx` ON `categories` (`active`,`position`);--> statement-breakpoint
CREATE INDEX `coupon_usage_player_idx` ON `coupon_usage` (`couponId`,`playerId`);--> statement-breakpoint
CREATE INDEX `coupons_active_window_idx` ON `coupons` (`active`,`startsAt`,`endsAt`);--> statement-breakpoint
CREATE INDEX `deliveries_queue_idx` ON `deliveries` (`serverId`,`status`,`nextAttemptAt`);--> statement-breakpoint
CREATE INDEX `deliveries_order_idx` ON `deliveries` (`orderId`);--> statement-breakpoint
CREATE INDEX `deliveries_player_idx` ON `deliveries` (`playerId`,`status`);--> statement-breakpoint
CREATE INDEX `logs_entity_idx` ON `logs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `logs_actor_idx` ON `logs` (`actorType`,`actorId`);--> statement-breakpoint
CREATE INDEX `logs_created_idx` ON `logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `order_items_server_idx` ON `order_items` (`serverId`);--> statement-breakpoint
CREATE INDEX `orders_player_status_idx` ON `orders` (`playerId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `payments_provider_payment_idx` ON `payments` (`provider`,`providerPaymentId`);--> statement-breakpoint
CREATE INDEX `players_user_idx` ON `players` (`userId`);--> statement-breakpoint
CREATE INDEX `product_servers_server_idx` ON `product_servers` (`serverId`);--> statement-breakpoint
CREATE INDEX `products_catalog_idx` ON `products` (`categoryId`,`active`,`position`);--> statement-breakpoint
CREATE INDEX `products_featured_idx` ON `products` (`featured`,`active`,`position`);--> statement-breakpoint
CREATE INDEX `servers_kind_active_idx` ON `servers` (`kind`,`active`);--> statement-breakpoint
CREATE INDEX `vip_grants_expiry_idx` ON `vip_grants` (`expiresAt`,`revokedAt`);--> statement-breakpoint
CREATE INDEX `vip_grants_player_idx` ON `vip_grants` (`playerId`,`serverId`);