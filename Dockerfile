# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    ZOO_DB_PATH=/data/zookeepr.sqlite

# Copy production node_modules from the build stage
COPY --from=deps /app/node_modules ./node_modules

# App source
COPY package.json package-lock.json ./
COPY server.js ./
COPY routes ./routes
COPY lib ./lib
COPY data ./data
COPY public ./public

# SQLite lives in a writable volume so it survives container restarts
RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
