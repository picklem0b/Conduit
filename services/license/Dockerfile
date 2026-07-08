FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy package files first for layer caching
COPY package.json ./

# Copy source
COPY src/ ./src/

# No npm install needed — no external dependencies

# Healthcheck reads the keepalive file written by the keepalive loop.
# Fails if the file doesn't exist or is older than 3 minutes.
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
  CMD test -f /tmp/.conduit_license_keepalive && \
      test $(( $(date +%s) - $(date +%s -r /tmp/.conduit_license_keepalive) )) -lt 180 \
      || exit 1

EXPOSE 3100

CMD ["bun", "src/index.ts"]