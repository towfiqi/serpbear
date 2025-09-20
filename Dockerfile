FROM node:22.11.0-alpine3.20 AS deps
ENV NPM_VERSION=11.6.0
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g npm@"${NPM_VERSION}"
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .


FROM node:22.11.0-alpine3.20 AS builder
WORKDIR /app
ENV NPM_VERSION=11.6.0
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app ./
RUN rm -rf /app/data /app/__tests__ /app/__mocks__
RUN npm run build


FROM node:22.11.0-alpine3.20 AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN set -xe && mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy built application files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Setup the cron and database
COPY --from=builder --chown=nextjs:nodejs /app/cron.js ./
COPY --from=builder --chown=nextjs:nodejs /app/email ./email
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/.sequelizerc ./.sequelizerc
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Copy production package files and install only production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Install concurrently globally for the runtime
RUN npm install -g npm@11.6.0 concurrently@7.6.0
RUN chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["concurrently","node server.js", "node cron.js"]