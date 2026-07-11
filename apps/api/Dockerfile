# syntax=docker/dockerfile:1
# Build from the REPO ROOT:  docker build -f apps/api/Dockerfile .

# ---------------------------------------------------------------------------
# deps — install full workspace dependency tree (cached on lockfile changes)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
# Manifests only, so this layer is cached until dependencies change.
# npm workspaces requires every workspace package.json to be present.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
# --ignore-scripts: root postinstall runs prisma generate, which needs the
# schema; we generate explicitly in the build stage instead.
# The nest.js CLI check fails the build immediately (with a clear message) if
# devDependencies didn't actually get installed, instead of surfacing as a
# confusing "nest: not found" three layers later in the build stage.
RUN npm ci --ignore-scripts \
  && test -x node_modules/.bin/nest || (echo "npm ci did not install @nestjs/cli — devDependencies missing" && exit 1)

# ---------------------------------------------------------------------------
# build — prisma generate, build @repo/shared then @repo/api
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web/package.json apps/web/package.json
RUN npx prisma generate --schema packages/db/prisma/schema.prisma \
  && npm run build --workspace @repo/shared \
  && npm run build --workspace @repo/api

# ---------------------------------------------------------------------------
# runtime — production dependencies only, non-root
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
# Schema + migrations must ship with the image for `prisma migrate deploy`.
COPY packages/db/prisma ./packages/db/prisma

# 1) prod deps only (scripts skipped — prisma CLI is a root devDependency, so
#    the postinstall `prisma generate` cannot run yet)
# 2) add the prisma CLI (needed at container start for migrate deploy)
# 3) explicitly generate the Prisma Client since scripts were ignored
RUN npm ci --omit=dev --ignore-scripts \
  && npm install --no-save --omit=dev prisma@^6.18.0 \
  && npx prisma generate --schema packages/db/prisma/schema.prisma \
  && npm cache clean --force

# Compiled output
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist

RUN chown -R node:node /app

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/health" || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy --schema packages/db/prisma/schema.prisma && node apps/api/dist/main.js"]
