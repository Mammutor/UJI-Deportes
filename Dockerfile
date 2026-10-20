# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.9.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV UJI_MODE=mock
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4321
ENV UJI_MODE=mock

RUN addgroup -S nodejs && adduser -S uji -G nodejs
RUN corepack enable && corepack prepare pnpm@12.9.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY shared ./shared

# Login persists sessions under /app/.data. The process runs as uji and
# cannot create that directory inside the root-owned /app.
RUN mkdir -p /app/.data && chown uji:nodejs /app/.data

USER uji
EXPOSE 4321
CMD ["pnpm", "exec", "tsx", "server/index.ts"]
