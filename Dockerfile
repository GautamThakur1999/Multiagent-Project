# AI Travel Planner — container image (Next.js 14 standalone output).
# Used by Railway (see railway.json) and any container host. The whole
# full-stack app (UI pages + /api routes) runs from a single Node server.

# 1) Install dependencies from the lockfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build the production app (.next/standalone)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces so the platform can route traffic; PORT is injected at runtime.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Run as a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs

EXPOSE 3000
# GEMINI_API_KEY is provided at runtime by the platform (never baked into the image).
CMD ["node", "server.js"]
