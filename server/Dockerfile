FROM node:20-alpine

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install build dependencies for sqlite3
RUN apk add --no-cache python3 make g++

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
