package com.playstorcraft.paper;

import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;

public final class PlayStorCraftPlugin extends JavaPlugin {
    private DeliveryPoller poller;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        boolean luckPermsAvailable = getServer().getPluginManager().getPlugin("LuckPerms") != null;
        if (!luckPermsAvailable) getLogger().warning("LuckPerms não foi encontrado. Marcadores @luckperms serão recusados até a dependência estar disponível.");
        poller = new DeliveryPoller(this, new StoreApiClient(this), luckPermsAvailable);
        long ticks = Math.max(5, getConfig().getLong("poll-interval-seconds", 15)) * 20L;
        getServer().getScheduler().runTaskTimerAsynchronously(this, poller, 40L, ticks);
        getLogger().info("PlayStorCraft conectado. O plugin consultará apenas entregas deste servidor.");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!command.getName().equalsIgnoreCase("playstorcraft")) return false;
        if (!sender.hasPermission("playstorcraft.admin")) { sender.sendMessage("§cSem permissão."); return true; }
        if (args.length == 1 && args[0].equalsIgnoreCase("sync")) {
            getServer().getScheduler().runTaskAsynchronously(this, poller);
            sender.sendMessage("§aSincronização da PlayStorCraft iniciada.");
            return true;
        }
        sender.sendMessage("§eUse /playstorcraft sync");
        return true;
    }
}
