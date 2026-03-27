# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Stage 2: Build the application
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN rm -rf data __tests__ __mocks__
RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy Next.js standalone output (includes traced node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy cron, migration, and email files
COPY --from=builder --chown=nextjs:nodejs /app/cron.js ./
COPY --from=builder --chown=nextjs:nodejs /app/email ./email
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/.sequelizerc ./.sequelizerc
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Install packages needed at runtime that are NOT reliably traced
# into the standalone node_modules by Next.js:
# - croner, cryptr, dotenv: used by cron.js (runs outside Next.js)
# - @googleapis/searchconsole: Google API packages have complex module
#   resolution that Next.js 12 file tracing (nft) does not follow
# - sequelize-cli: used by entrypoint.sh for DB migrations
# - concurrently: process manager for server.js + cron.js
RUN chmod +x /app/entrypoint.sh && \
    rm -f package.json && npm init -y && \
    npm install --no-package-lock \
      croner@9.0.0 \
      cryptr@6.4.0 \
      dotenv@16.0.3 \
      @googleapis/searchconsole@1.0.5 \
      sequelize-cli@6.6.5 \
      concurrently@7.6.0 \
      @isaacs/ttlcache@1.4.1 && \
    npm cache clean --force && \
    rm -rf /tmp/* /root/.npm

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npx", "concurrently", "node server.js", "node cron.js"]