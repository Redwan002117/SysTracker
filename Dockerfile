# ============================================
# Stage 1: Build Dashboard (Next.js)
# ============================================
FROM node:22-slim AS builder-dashboard

WORKDIR /app/dashboard

# Copy dashboard package files
COPY dashboard/package*.json ./

# Install dashboard dependencies
RUN npm install

# Copy dashboard source code
COPY dashboard/ ./

# Build dashboard (static export)
RUN npm run build

# Verify build output exists
RUN ls -la out/ && echo "Dashboard build successful"

# ============================================
# Stage 2: Server Runtime
# ============================================
FROM node:22-slim

WORKDIR /app

# Install system dependencies for native modules (sqlite3)
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy server package files
COPY server/package*.json ./

# Install server production dependencies
# Note: Using npm install instead of npm ci for flexibility
RUN npm install --omit=dev

# Copy server source code
COPY server/server.js ./
COPY server/schema_sqlite.sql ./
COPY server/schema.sql ./
COPY server/emailTemplates.js ./
COPY server/dataValidation.js ./
COPY server/errorLogger.js ./
COPY server/init_db.js ./
COPY server/migrate_db.js ./
COPY server/migrate_processes.js ./

# Copy built dashboard from stage 1
COPY --from=builder-dashboard /app/dashboard/out ./dashboard-dist

# Create necessary directories
RUN mkdir -p data uploads logs

# Create non-root user for security
# Use UID 1001 to avoid conflicts with node user (typically UID 1000)
RUN useradd -m -u 1001 systracker && \
    chown -R systracker:systracker /app

USER systracker

# Expose port
EXPOSE 7777

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7777/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start server
CMD ["node", "server.js"]
