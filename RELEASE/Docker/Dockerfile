FROM node:18-alpine

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

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
