package com.playstorcraft.paper;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

final class StoreApiClient {
    private final JavaPlugin plugin;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final Gson gson = new Gson();

    StoreApiClient(JavaPlugin plugin) { this.plugin = plugin; }

    List<DeliveryEnvelope> claim() throws IOException, InterruptedException {
        JsonObject body = new JsonObject();
        body.addProperty("limit", plugin.getConfig().getInt("claim-limit", 10));
        JsonObject response = request("/api/minecraft/deliveries/claim", body).getAsJsonObject();
        return gson.fromJson(response.get("deliveries"), new TypeToken<List<DeliveryEnvelope>>() {}.getType());
    }

    void complete(DeliveryEnvelope delivery) throws IOException, InterruptedException { acknowledge("/api/minecraft/deliveries/complete", delivery, null); }
    void fail(DeliveryEnvelope delivery, String error) throws IOException, InterruptedException { acknowledge("/api/minecraft/deliveries/fail", delivery, error); }
    void defer(DeliveryEnvelope delivery) throws IOException, InterruptedException { acknowledge("/api/minecraft/deliveries/defer", delivery, null); }

    private void acknowledge(String path, DeliveryEnvelope delivery, String error) throws IOException, InterruptedException {
        JsonObject body = new JsonObject();
        body.addProperty("deliveryId", delivery.deliveryId());
        body.addProperty("claimToken", delivery.claimToken());
        if (error != null) body.addProperty("error", error.length() > 1900 ? error.substring(0, 1900) : error);
        request(path, body);
    }

    private com.google.gson.JsonElement request(String path, JsonObject body) throws IOException, InterruptedException {
        String base = plugin.getConfig().getString("api-base-url", "").replaceAll("/$", "");
        String key = plugin.getConfig().getString("server-api-key", "");
        if (base.isBlank() || key.equals("ALTERE_ESTA_CHAVE")) throw new IOException("Configure api-base-url e server-api-key no config.yml.");
        HttpRequest request = HttpRequest.newBuilder(URI.create(base + path)).timeout(Duration.ofSeconds(20))
            .header("Content-Type", "application/json").header("X-PlayStor-Server-Key", key)
            .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(body))).build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) throw new IOException("API respondeu HTTP " + response.statusCode() + ": " + response.body());
        return gson.fromJson(response.body(), com.google.gson.JsonElement.class);
    }
}

record DeliveryEnvelope(String deliveryId, String claimToken, String player, String uuid, String server, String product, String duration, List<String> commands) {}
