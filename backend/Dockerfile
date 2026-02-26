# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-slim
WORKDIR /app

# Install wget + download Vazirmatn font for Persian PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends wget \
    && mkdir -p /app/assets/fonts \
    && wget -q "https://github.com/rastikerdar/vazirmatn/raw/master/fonts/TTF/Vazirmatn-Regular.ttf" \
         -O /app/assets/fonts/Vazirmatn-Regular.ttf \
    || echo "⚠ Font download failed – PDF will use fallback font" \
    && apt-get purge -y wget && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output + Prisma client
COPY --from=builder /app/dist            ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/docker-entrypoint.sh"]
