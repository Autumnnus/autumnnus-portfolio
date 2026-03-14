FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN corepack enable
COPY package.json yarn.lock .yarnrc* ./
RUN yarn install --frozen-lockfile

FROM base AS builder
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs

USER nextjs
EXPOSE 3001

CMD ["node", "server.js"]
