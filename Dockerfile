FROM node:22.11.0-alpine3.20 AS deps
ENV NPM_VERSION=10.3.0
RUN npm install -g npm@"${NPM_VERSION}"
WORKDIR /app

COPY package.json ./
RUN npm install
COPY . .


FROM node:22.11.0-alpine3.20 AS builder
WORKDIR /app
ENV NPM_VERSION=10.3.0
RUN npm install -g npm@"${NPM_VERSION}"
COPY --from=deps /app ./
RUN rm -rf /app/data
RUN rm -rf /app/__tests__
RUN rm -rf /app/__mocks__
RUN npm run build


FROM node:22.11.0-alpine3.20 AS runner
WORKDIR /app
ENV NPM_VERSION=10.3.0
RUN npm install -g npm@"${NPM_VERSION}"
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN set -xe && mkdir -p /app/data && chown nextjs:nodejs /app/data
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# setup the cron
COPY --from=builder --chown=nextjs:nodejs /app/cron.js ./
COPY --from=builder --chown=nextjs:nodejs /app/email ./email
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/.sequelizerc ./.sequelizerc
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
RUN rm package.json
RUN npm init -y 
RUN npm i cryptr@6.0.3 dotenv@16.0.3 croner@9.0.0 @googleapis/searchconsole@1.0.5 sequelize-cli@6.6.2 @isaacs/ttlcache@1.4.1
RUN npm i -g concurrently

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["concurrently","node server.js", "node cron.js"]