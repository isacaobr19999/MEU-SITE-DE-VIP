import fs from 'node:fs';
const channels = JSON.parse(fs.readFileSync('/home/ubuntu/playstorcraft/docs/discord-channels-current.json', 'utf8'));
const names = new Set(['regras','anuncios','changelog','geral','midia','comandos','status-servidor','ip-servidor','denuncias','Lobby','Survival 1','Survival 2','Staff']);
for (const c of channels) {
  if (names.has(c.name)) console.log(`${c.id}\t${c.name}\ttype=${c.type}\tparent=${c.parent_id ?? ''}`);
}
