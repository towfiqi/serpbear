FROM node:22.11.0-alpine3.20 AS base
ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_VERSION=11.6.0 \
    NODE_ENV=production
WORKDIR /app
RUN npm install -g npm@"${NPM_VERSION}"
# Create non-root user early for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production && \
    cp -R node_modules production_node_modules && \
    npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Remove unnecessary files for security and smaller image
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/.next/cache \
    rm -rf __tests__ __mocks__ *.md docs && \
    npm run build && \
    chmod +x entrypoint.sh

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/production_node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy runtime dependencies with proper permissions
COPY --from=builder --chown=nextjs:nodejs /app/cron.js ./cron.js
COPY --from=builder --chown=nextjs:nodejs /app/email ./email
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/.sequelizerc ./.sequelizerc
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R nextjs:nodejs /app/data && \
    chmod 755 /app/data

# Security: Remove package managers and unnecessary files
RUN rm -rf /root/.npm /tmp/* /var/cache/apk/*

USER nextjs
EXPOSE 3000

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "http.get('http://localhost:3000/api/domains', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
