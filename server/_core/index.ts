import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { ingestMonitoringRoute } from "../routes/monitoring";
import { registerLocalAuthRoutes } from "../localAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { mercadoPagoWebhook } from "../webhooks/mercadoPago";
import { claimMinecraftDeliveries, completeMinecraftDelivery, deferMinecraftDelivery, failMinecraftDelivery, syncMinecraftPlayerRoute, updateMinecraftStatusRoute } from "../minecraft";
import { updateCommunityStatusRoute } from "../community";
import { acknowledgeDiscordNotificationsRoute, listDiscordNotificationsRoute } from "../discordNotifications";
import { recordTicketTranscriptsRoute } from "../ticketTranscripts";
import { commerceMaintenance } from "../scheduled/commerceMaintenance";
import { storeMaintenanceScheduler } from "../scheduled/storeMaintenance";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  if (process.env.SELF_HOSTED === "true") {
    registerLocalAuthRoutes(app);
  } else {
    const { registerOAuthRoutes } = await import("./oauth");
    registerOAuthRoutes(app);
  }
  app.post("/api/webhooks/mercadopago", mercadoPagoWebhook);
  app.post("/api/minecraft/players/sync", syncMinecraftPlayerRoute);
  app.post("/api/minecraft/status", updateMinecraftStatusRoute);
  app.post("/api/minecraft/deliveries/claim", claimMinecraftDeliveries);
  app.post("/api/minecraft/deliveries/complete", completeMinecraftDelivery);
  app.post("/api/minecraft/deliveries/fail", failMinecraftDelivery);
  app.post("/api/minecraft/deliveries/defer", deferMinecraftDelivery);
  app.post("/api/integrations/discord/status", updateCommunityStatusRoute);
  app.post("/api/integrations/discord/ticket-transcripts", recordTicketTranscriptsRoute);
  app.get("/api/integrations/discord/operations", listDiscordNotificationsRoute);
  app.post("/api/integrations/discord/operations/ack", acknowledgeDiscordNotificationsRoute);
  app.post("/api/scheduled/commerce-maintenance", commerceMaintenance);
  app.post("/api/scheduled/store-maintenance", storeMaintenanceScheduler);
  app.post("/api/internal/monitoring", ingestMonitoringRoute);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
