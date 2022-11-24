FROM node:lts-alpine AS deps

WORKDIR /app

COPY package.json ./
RUN npm install
COPY . .


FROM node:lts-alpine AS builder
WORKDIR /app
COPY --from=deps /app ./
RUN npm run build


FROM node:lts-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# setup the cron
COPY --from=builder --chown=nextjs:nodejs /app/cron.js ./
RUN npm i cryptr dotenv
RUN npm i -g concurrently

USER nextjs

EXPOSE 3000

# CMD ["node", "server.js"]
# CMD ["npm", "start"]
CMD ["concurrently","node server.js", "node cron.js"]

