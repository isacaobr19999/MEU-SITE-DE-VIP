const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('/tmp/community-status.json', 'utf8'));
const data = raw?.result?.data?.json;
if (!data) process.exit(2);
console.log(JSON.stringify({
  guildName: data.guildName,
  inviteUrl: data.inviteUrl,
  discordOnline: data.discordOnline,
  memberCount: data.memberCount,
  minecraftStatus: data.minecraftStatus,
  minecraftOnline: data.minecraftOnline,
}, null, 2));
