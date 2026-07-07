# syntax=docker/dockerfile:1
# Build from the REPO ROOT:  docker build -f apps/web/Dockerfile .

# ---------------------------------------------------------------------------
# deps — install full workspace dependency tree (cached on lockfile changes)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
# npm workspaces requires every workspace package.json to be present.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
# --ignore-scripts: root postinstall runs prisma generate, which needs the
# schema; we generate explicitly in the build stage instead.
RUN npm ci --ignore-scripts

# ---------------------------------------------------------------------------
# build — prisma generate, build @repo/shared then next build (standalone)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/api/package.json apps/api/package.json

# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
# Defaults are safe placeholders; override with --build-arg / compose args.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_HOST_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k
ARG NEXT_PUBLIC_INSTAGRAM_APP_ID=placeholder
# Instagram Business Login dialog (www.instagram.com/oauth/authorize). Empty
# default: the connect button falls back to building the URL from the app id.
ARG NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_HOST_URL=$NEXT_PUBLIC_HOST_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_INSTAGRAM_APP_ID=$NEXT_PUBLIC_INSTAGRAM_APP_ID \
    NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL=$NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate --schema packages/db/prisma/schema.prisma \
  && npm run build --workspace @repo/shared \
  && npm run build --workspace @repo/web

# ---------------------------------------------------------------------------
# runtime — Next.js standalone output, non-root
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apk add --no-cache openssl

# Standalone output keeps the monorepo layout: server.js lives at apps/web/.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
