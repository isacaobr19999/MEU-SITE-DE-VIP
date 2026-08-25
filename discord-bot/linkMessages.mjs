import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function linkSuccessMessage(username) {
  return `✅ **Vínculo concluído com sucesso!**\nSua conta Minecraft **${username || "jogador"}** foi conectada ao Discord.\n\nA partir de agora, seus benefícios e entregas poderão ser associados corretamente à sua conta.\nSe precisar trocar de conta, use **/unlink**.`;
}

export function linkCodeMessage(code) {
  return `🔐 **Código de vínculo Minecraft**\n\nDigite este código no botão de vínculo do Discord:\n\n### \`${code}\`\n\n⏱️ O código expira em **10 minutos** e pode ser usado uma única vez.\nSe estiver no celular, toque e segure o código para copiá-lo.`;
}

export function copyCodeButton(code) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`legacy-link:copy:${code}`).setLabel("Copiar código").setStyle(ButtonStyle.Primary)
  );
}
