FROM node:22.11.0-alpine3.20 AS base
ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_VERSION=11.6.0
WORKDIR /app
RUN npm install -g npm@"${NPM_VERSION}"

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .

FROM base AS builder
COPY --from=deps /app ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/.next/cache \
    sh -c "rm -rf __tests__ __mocks__ && npm run build && chmod +x entrypoint.sh"

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && mkdir -p /app/data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/cron.js ./cron.js
COPY --from=builder --chown=nextjs:nodejs /app/email ./email
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/.sequelizerc ./.sequelizerc
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
