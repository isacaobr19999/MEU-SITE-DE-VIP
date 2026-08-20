package com.playstorcraft.status;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;

public final class PaperStatusPlugin extends JavaPlugin {
    private String apiBaseUrl;
    private String serverApiKey;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        apiBaseUrl = getConfig().getString("api-base-url", "").replaceAll("/+$", "");
        serverApiKey = getConfig().getString("server-api-key", "").trim();
        if (apiBaseUrl.isBlank() || serverApiKey.isBlank() || serverApiKey.equals("ALTERE_ESTA_CHAVE")) {
            getLogger().warning("Telemetria desativada: configure api-base-url e server-api-key em config.yml.");
            return;
        }
        long intervalTicks = Math.max(30, getConfig().getLong("status-interval-seconds", 60)) * 20L;
        getServer().getScheduler().runTaskTimerAsynchronously(this, this::reportSafely, 20L, intervalTicks);
        getLogger().info("Telemetria da comunidade ativada.");
    }

    private void reportSafely() {
        try {
            int online = Bukkit.getOnlinePlayers().size();
            int max = Bukkit.getMaxPlayers();
            int tpsMilli = (int) Math.round(Math.max(0D, Bukkit.getTPS()[0]) * 1000D);
            int msptMicros = (int) Math.round(Math.max(0D, Bukkit.getAverageTickTime()) * 1000D);
            String body = "{\"status\":\"ONLINE\",\"playersOnline\":" + online
                    + ",\"playersMax\":" + max
                    + ",\"motd\":\"" + escape(Bukkit.getMotd()) + "\""
                    + ",\"version\":\"" + escape(Bukkit.getVersion()) + "\""
                    + ",\"tpsMilli\":" + tpsMilli
                    + ",\"msptMicros\":" + msptMicros + "}";
            HttpURLConnection connection = (HttpURLConnection) URI.create(apiBaseUrl + "/api/minecraft/status").toURL().openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(8_000);
            connection.setReadTimeout(8_000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("x-playstor-server-key", serverApiKey);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(body.getBytes(StandardCharsets.UTF_8));
            }
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) getLogger().warning("A API recusou a telemetria: HTTP " + status);
            connection.disconnect();
        } catch (Exception error) {
            getLogger().warning("Não foi possível publicar a telemetria: " + error.getMessage());
        }
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ").replace("\r", " ");
    }
}
