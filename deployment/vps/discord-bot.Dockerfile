FROM node:22-bookworm-slim

WORKDIR /bot
COPY discord-bot/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY discord-bot/ ./

ENV NODE_ENV=production
CMD ["node", "index.mjs"]
