FROM node:20-slim

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install build dependencies if needed (often not required on Debian/Ubuntu for prebuilt binaries)
# If sqlite3 still fails, we can install python3 and build-essential via apt-get
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install production dependencies
RUN npm install --only=production

# Copy server source code
COPY server.js .
COPY schema_sqlite.sql .

# Copy built dashboard assets (make sure this folder exists from build step!)
COPY dashboard-dist ./dashboard-dist

# Expose the new default port
EXPOSE 7777

# Start the server
CMD ["node", "server.js"]
