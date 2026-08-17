import fs from 'node:fs';

const path = '/home/ubuntu/playstorcraft/docs/discord-channels-current.json';
const channels = JSON.parse(fs.readFileSync(path, 'utf8'));
const byId = new Map(channels.map(c => [c.id, c]));
const rows = channels.map(c => ({
  id: c.id,
  type: c.type === 4 ? 'category' : c.type === 0 ? 'text' : c.type === 2 ? 'voice' : String(c.type),
  name: c.name,
  parent: c.parent_id ? byId.get(c.parent_id)?.name ?? c.parent_id : '',
  messages: c.last_message_id ? 'has-message-id' : 'empty-export',
  overwrites: c.permission_overwrites?.length ?? 0,
}));
const summary = {
  total: channels.length,
  categories: rows.filter(r => r.type === 'category').length,
  text: rows.filter(r => r.type === 'text').length,
  voice: rows.filter(r => r.type === 'voice').length,
  channelsWithMessageId: rows.filter(r => r.messages === 'has-message-id').length,
  rows,
};
fs.writeFileSync('/home/ubuntu/playstorcraft/docs/discord-channel-audit.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({total: summary.total, categories: summary.categories, text: summary.text, voice: summary.voice, channelsWithMessageId: summary.channelsWithMessageId}, null, 2));
