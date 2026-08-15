package com.playstorcraft.paper;

import net.luckperms.api.LuckPerms;
import net.luckperms.api.node.types.InheritanceNode;
import org.bukkit.Bukkit;
import org.bukkit.command.ConsoleCommandSender;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.concurrent.CompletableFuture;

final class DeliveryPoller implements Runnable {
    private final JavaPlugin plugin;
    private final StoreApiClient api;
    private final LuckPerms luckPerms;

    DeliveryPoller(JavaPlugin plugin, StoreApiClient api, LuckPerms luckPerms) { this.plugin = plugin; this.api = api; this.luckPerms = luckPerms; }

    @Override public void run() {
        try {
            for (DeliveryEnvelope delivery : api.claim()) executeOnMainThread(delivery);
        } catch (Exception error) { plugin.getLogger().warning("Falha ao consultar entregas: " + error.getMessage()); }
    }

    private void executeOnMainThread(DeliveryEnvelope delivery) {
        Bukkit.getScheduler().runTask(plugin, () -> {
            try {
                if (Bukkit.getPlayer(java.util.UUID.fromString(delivery.uuid())) == null) {
                    Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> defer(delivery));
                    return;
                }
                CompletableFuture<?> chain = CompletableFuture.completedFuture(null);
                for (String command : delivery.commands()) {
                    if (command.startsWith("@luckperms:")) chain = chain.thenCompose(ignored -> applyLuckPermsMarker(delivery, command));
                    else {
                        ConsoleCommandSender console = Bukkit.getConsoleSender();
                        if (!Bukkit.dispatchCommand(console, command.startsWith("/") ? command.substring(1) : command)) throw new IllegalStateException("Comando recusado: " + command);
                    }
                }
                chain.whenComplete((ignored, error) -> Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> acknowledge(delivery, error)));
            } catch (Exception error) { Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> acknowledge(delivery, error)); }
        });
    }

    private CompletableFuture<Void> applyLuckPermsMarker(DeliveryEnvelope delivery, String marker) {
        if (luckPerms == null) return CompletableFuture.failedFuture(new IllegalStateException("LuckPerms não está disponível"));
        String[] values = marker.split(":", 3);
        if (values.length != 3 || !(values[1].equals("add") || values[1].equals("remove"))) return CompletableFuture.failedFuture(new IllegalArgumentException("Marcador LuckPerms inválido"));
        return luckPerms.getUserManager().loadUser(java.util.UUID.fromString(delivery.uuid())).thenCompose(user -> {
            InheritanceNode node = InheritanceNode.builder(values[2]).build();
            if (values[1].equals("add")) user.data().add(node); else user.data().remove(node);
            return luckPerms.getUserManager().saveUser(user);
        });
    }

    private void acknowledge(DeliveryEnvelope delivery, Throwable error) {
        try { if (error == null) api.complete(delivery); else api.fail(delivery, error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage()); }
        catch (Exception acknowledgementError) { plugin.getLogger().warning("Falha ao confirmar entrega " + delivery.deliveryId() + ": " + acknowledgementError.getMessage()); }
    }

    private void defer(DeliveryEnvelope delivery) {
        try { api.defer(delivery); }
        catch (Exception error) { plugin.getLogger().warning("Falha ao adiar entrega " + delivery.deliveryId() + ": " + error.getMessage()); }
    }
}
