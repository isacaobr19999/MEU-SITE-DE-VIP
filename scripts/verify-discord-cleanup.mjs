import fs from 'node:fs';
const channels = JSON.parse(fs.readFileSync('/home/ubuntu/playstorcraft/docs/discord-channels-after-cleanup.json','utf8'));
const removed = new Set(['regras','changelog','geral','midia','comandos','status-servidor','ip-servidor','denuncias']);
const essential = new Set(['anuncios','login-no-servidor','👋・boas-vindas','🟢・status-do-servidor','🎫・abrir-ticket','🐛・reportar-bug','🎁・cupons']);
const names = new Set(channels.map(c => c.name));
console.log(JSON.stringify({
  removedStillPresent: [...removed].filter(name => names.has(name)),
  essentialMissing: [...essential].filter(name => !names.has(name)),
  channelCount: channels.length,
  categories: channels.filter(c => c.type === 4).map(c => c.name),
}, null, 2));
