import json
from pathlib import Path
channels = json.loads(Path('/home/ubuntu/playstorcraft/docs/discord-channels-current.json').read_text())
names = {'regras','changelog','geral','midia','comandos','status-servidor','ip-servidor','denuncias','login-no-servidor','Lobby','Survival 1','Survival 2','Staff'}
for c in channels:
    if c.get('name') in names:
        print(json.dumps({k: c.get(k) for k in ('id','name','type','parent_id','last_message_id','position')}, ensure_ascii=False))
