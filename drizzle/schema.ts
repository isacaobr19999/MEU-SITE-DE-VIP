import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const auditActorTypes = ["admin", "customer", "gateway", "server", "system"] as const;
const deliveryStatuses = ["PENDING", "CLAIMED", "PROCESSING", "COMPLETED", "RETRYING", "FAILED", "CANCELLED"] as const;
const orderStatuses = ["PENDING", "WAITING_PAYMENT", "PAID", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED", "FAILED"] as const;
const paymentStatuses = ["PENDING", "PROCESSING", "APPROVED", "REJECTED", "CANCELLED", "REFUNDED", "FAILED"] as const;
const productKinds = ["VIP", "COINS", "KIT", "COSMETIC"] as const;
const serverKinds = ["SURVIVAL", "SKYBLOCK", "BEDWARS", "GLOBAL"] as const;

/** Identidade de usuários autenticados e papéis de acesso. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Perfil Minecraft, vinculado opcionalmente ao usuário autenticado da loja. */
export const players = mysqlTable(
  "players",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    username: varchar("username", { length: 16 }).notNull(),
    uuid: varchar("uuid", { length: 36 }).notNull(),
    email: varchar("email", { length: 320 }),
    lastSeenAt: timestamp("lastSeenAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("players_username_unique").on(table.username),
    uniqueIndex("players_uuid_unique").on(table.uuid),
    index("players_user_idx").on(table.userId),
  ]
);

export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 96 }).notNull(),
    slug: varchar("slug", { length: 96 }).notNull(),
    description: text("description"),
    imageUrl: varchar("imageUrl", { length: 1024 }),
    position: int("position").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("categories_slug_unique").on(table.slug), index("categories_active_position_idx").on(table.active, table.position)]
);

/** Cada servidor possui uma chave própria, armazenada apenas como hash. */
export const servers = mysqlTable(
  "servers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 96 }).notNull(),
    slug: varchar("slug", { length: 48 }).notNull(),
    kind: mysqlEnum("kind", serverKinds).notNull(),
    apiKeyHash: varchar("apiKeyHash", { length: 255 }).notNull(),
    apiKeyLastFour: varchar("apiKeyLastFour", { length: 4 }).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("servers_slug_unique").on(table.slug), index("servers_kind_active_idx").on(table.kind, table.active)]
);

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    shortDescription: varchar("shortDescription", { length: 280 }),
    description: text("description"),
    kind: mysqlEnum("kind", productKinds).notNull(),
    imageUrl: varchar("imageUrl", { length: 1024 }),
    priceCents: int("priceCents").notNull(),
    durationDays: int("durationDays"),
    luckPermsGroup: varchar("luckPermsGroup", { length: 96 }),
    deliveryCommands: json("deliveryCommands").$type<string[]>().notNull(),
    featured: boolean("featured").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    position: int("position").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_catalog_idx").on(table.categoryId, table.active, table.position),
    index("products_featured_idx").on(table.featured, table.active, table.position),
  ]
);

/** Vincula um produto a um ou mais destinos, inclusive GLOBAL. */
export const productServers = mysqlTable(
  "product_servers",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
    serverId: int("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
  },
  table => [
    uniqueIndex("product_servers_pair_unique").on(table.productId, table.serverId),
    index("product_servers_server_idx").on(table.serverId),
  ]
);

export const coupons = mysqlTable(
  "coupons",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 48 }).notNull(),
    description: varchar("description", { length: 280 }),
    type: mysqlEnum("type", ["PERCENTAGE", "FIXED"]).notNull(),
    percentageBasisPoints: int("percentageBasisPoints"),
    fixedDiscountCents: int("fixedDiscountCents"),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    maxUses: int("maxUses"),
    maxUsesPerPlayer: int("maxUsesPerPlayer").default(1).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("coupons_code_unique").on(table.code), index("coupons_active_window_idx").on(table.active, table.startsAt, table.endsAt)]
);

export const couponProducts = mysqlTable(
  "coupon_products",
  {
    id: int("id").autoincrement().primaryKey(),
    couponId: int("couponId").notNull().references(() => coupons.id, { onDelete: "cascade" }),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  },
  table => [uniqueIndex("coupon_products_pair_unique").on(table.couponId, table.productId)]
);

/** A chave de idempotência é fornecida pelo navegador uma única vez por tentativa de checkout. */
export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderNumber: varchar("orderNumber", { length: 24 }).notNull(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    playerId: int("playerId").notNull().references(() => players.id, { onDelete: "restrict" }),
    couponId: int("couponId").references(() => coupons.id, { onDelete: "set null" }),
    status: mysqlEnum("status", orderStatuses).default("PENDING").notNull(),
    subtotalCents: int("subtotalCents").notNull(),
    discountCents: int("discountCents").default(0).notNull(),
    totalCents: int("totalCents").notNull(),
    currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 96 }).notNull(),
    placedAt: timestamp("placedAt").defaultNow().notNull(),
    paidAt: timestamp("paidAt"),
    completedAt: timestamp("completedAt"),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("orders_number_unique").on(table.orderNumber),
    uniqueIndex("orders_idempotency_unique").on(table.idempotencyKey),
    index("orders_player_status_idx").on(table.playerId, table.status, table.createdAt),
    index("orders_status_created_idx").on(table.status, table.createdAt),
  ]
);

/** Itens mantêm snapshots para que mudanças futuras no produto não alterem compras históricas. */
export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "restrict" }),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "restrict" }),
    serverId: int("serverId").notNull().references(() => servers.id, { onDelete: "restrict" }),
    productName: varchar("productName", { length: 160 }).notNull(),
    quantity: int("quantity").default(1).notNull(),
    unitPriceCents: int("unitPriceCents").notNull(),
    durationDays: int("durationDays"),
    deliveryCommands: json("deliveryCommands").$type<string[]>().notNull(),
    luckPermsGroup: varchar("luckPermsGroup", { length: 96 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("order_items_order_idx").on(table.orderId), index("order_items_server_idx").on(table.serverId)]
);

export const payments = mysqlTable(
  "payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "restrict" }),
    provider: varchar("provider", { length: 48 }).notNull(),
    providerPaymentId: varchar("providerPaymentId", { length: 160 }),
    providerEventId: varchar("providerEventId", { length: 160 }),
    method: mysqlEnum("method", ["PIX", "CARD", "OTHER"]).notNull(),
    status: mysqlEnum("status", paymentStatuses).default("PENDING").notNull(),
    amountCents: int("amountCents").notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 96 }).notNull(),
    gatewayPayload: json("gatewayPayload").$type<Record<string, unknown>>(),
    authorizedAt: timestamp("authorizedAt"),
    paidAt: timestamp("paidAt"),
    refundedAt: timestamp("refundedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("payments_idempotency_unique").on(table.idempotencyKey),
    uniqueIndex("payments_provider_event_unique").on(table.provider, table.providerEventId),
    index("payments_order_idx").on(table.orderId),
    index("payments_provider_payment_idx").on(table.provider, table.providerPaymentId),
  ]
);

/** Fila persistida de entregas; somente um servidor pode possuir uma reivindicação válida por vez. */
export const deliveries = mysqlTable(
  "deliveries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "restrict" }),
    orderItemId: int("orderItemId").notNull().references(() => orderItems.id, { onDelete: "restrict" }),
    playerId: int("playerId").notNull().references(() => players.id, { onDelete: "restrict" }),
    serverId: int("serverId").notNull().references(() => servers.id, { onDelete: "restrict" }),
    status: mysqlEnum("status", deliveryStatuses).default("PENDING").notNull(),
    commandTemplates: json("commandTemplates").$type<string[]>().notNull(),
    attemptCount: int("attemptCount").default(0).notNull(),
    maxAttempts: int("maxAttempts").default(8).notNull(),
    claimedByServerId: int("claimedByServerId").references(() => servers.id, { onDelete: "set null" }),
    claimTokenHash: varchar("claimTokenHash", { length: 255 }),
    claimExpiresAt: timestamp("claimExpiresAt"),
    nextAttemptAt: timestamp("nextAttemptAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    lastError: text("lastError"),
    idempotencyKey: varchar("idempotencyKey", { length: 96 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("deliveries_idempotency_unique").on(table.idempotencyKey),
    index("deliveries_queue_idx").on(table.serverId, table.status, table.nextAttemptAt),
    index("deliveries_order_idx").on(table.orderId),
    index("deliveries_player_idx").on(table.playerId, table.status),
  ]
);

/** Grants são usados para agendar remoções de grupos após a duração contratada. */
export const vipGrants = mysqlTable(
  "vip_grants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    playerId: int("playerId").notNull().references(() => players.id, { onDelete: "restrict" }),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "restrict" }),
    serverId: int("serverId").notNull().references(() => servers.id, { onDelete: "restrict" }),
    groupName: varchar("groupName", { length: 96 }).notNull(),
    grantedByDeliveryId: varchar("grantedByDeliveryId", { length: 36 }).notNull().references(() => deliveries.id, { onDelete: "restrict" }),
    startsAt: timestamp("startsAt").notNull(),
    expiresAt: timestamp("expiresAt"),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("vip_grants_expiry_idx").on(table.expiresAt, table.revokedAt), index("vip_grants_player_idx").on(table.playerId, table.serverId)]
);

export const couponUsage = mysqlTable(
  "coupon_usage",
  {
    id: int("id").autoincrement().primaryKey(),
    couponId: int("couponId").notNull().references(() => coupons.id, { onDelete: "restrict" }),
    playerId: int("playerId").notNull().references(() => players.id, { onDelete: "restrict" }),
    orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "restrict" }),
    discountCents: int("discountCents").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("coupon_usage_order_unique").on(table.orderId),
    index("coupon_usage_player_idx").on(table.couponId, table.playerId),
  ]
);

/** Perfil administrativo separado permite políticas sem duplicar a identidade do usuário. */
export const adminUsers = mysqlTable(
  "admin_users",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "restrict" }),
    permissions: json("permissions").$type<string[]>().notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("admin_users_user_unique").on(table.userId), index("admin_users_active_idx").on(table.active)]
);

/** Log de auditoria imutável de ações administrativas, do gateway e dos servidores Minecraft. */
export const logs = mysqlTable(
  "logs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorType: mysqlEnum("actorType", auditActorTypes).notNull(),
    actorId: varchar("actorId", { length: 160 }),
    action: varchar("action", { length: 128 }).notNull(),
    entityType: varchar("entityType", { length: 96 }).notNull(),
    entityId: varchar("entityId", { length: 160 }),
    ipHash: varchar("ipHash", { length: 128 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("logs_entity_idx").on(table.entityType, table.entityId), index("logs_actor_idx").on(table.actorType, table.actorId), index("logs_created_idx").on(table.createdAt)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type OrderStatus = (typeof orderStatuses)[number];
export type DeliveryStatus = (typeof deliveryStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
