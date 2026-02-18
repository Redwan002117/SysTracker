# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Output is in ./out (static export)

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy static export from builder
COPY --from=builder /app/out /usr/share/nginx/html

# nginx config: handle Next.js static export (SPA-style fallback + trailing slash)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# No EXPOSE — map any port at runtime:
#   docker run -p 2222:80 systracker-portfolio

CMD ["nginx", "-g", "daemon off;"]
