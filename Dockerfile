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

# Bright Data terminates TLS on port 44445 and presents its own certificate, so
# the proxy scraper cannot verify google.com against the public roots. Shipping
# their root CA lets NODE_EXTRA_CA_CERTS=/app/certs/brightdata_root_ca_44445.crt
# trust that one issuer instead of turning verification off process-wide with
# NODE_TLS_REJECT_UNAUTHORIZED=0. Unused when no proxy scraper is configured.
COPY --from=builder --chown=nextjs:nodejs /app/certs ./certs

# Tools that run beside the Next.js server (cron.js, the migrations, the
# process manager) are not part of its traced output, so they get their own
# folder. Installing them into /app/node_modules ran npm over the standalone
# tree: it pruned the packages it did not know (Turbopack loads
# @tanstack/react-query from there at runtime) and trusted the package.json-only
# stubs the tracer leaves behind (fs-extra), so both pages and sequelize-cli
# broke. NODE_PATH lets cron.js reach this folder; PATH exposes its binaries.
RUN chmod +x /app/entrypoint.sh && \
    mkdir -p /app/runtime && cd /app/runtime && npm init -y > /dev/null && \
    npm install --no-package-lock \
      croner@9.0.0 \
      cryptr@6.4.0 \
      dotenv@16.0.3 \
      sequelize-cli@6.6.5 \
      concurrently@7.6.0 && \
    npm cache clean --force && \
    rm -rf /tmp/* /root/.npm

ENV NODE_PATH=/app/runtime/node_modules
ENV PATH=/app/runtime/node_modules/.bin:$PATH

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["concurrently", "node server.js", "node cron.js"]