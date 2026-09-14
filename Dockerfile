# Multi-stage build: install + build in a full image, run in a leaner one
# with just ffmpeg + Chromium (for Remotion's headless rendering) added.

FROM node:24-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app

# ffmpeg for narration/video muxing (fluent-ffmpeg), chromium + its shared
# libs for Remotion's headless rendering.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    chromium \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.remotion-bundle ./.remotion-bundle
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/remotion ./remotion

EXPOSE 3000
CMD ["npm", "start"]
