FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src/

RUN npm run prisma:generate
RUN npm run build

# ── Production image ──────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

RUN npm run prisma:generate

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p logs \
    && chmod +x docker-entrypoint.sh \
    && chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
