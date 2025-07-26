# Multi-stage Dockerfile for JioMart Clone
# Stage 1: Build React client
FROM node:18-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production

COPY client/ ./
RUN npm run build

# Stage 2: Build Node.js server
FROM node:18-alpine AS server-build

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

# Stage 3: Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy server files
COPY --from=server-build --chown=nodejs:nodejs /app/server ./server
# Copy built client files
COPY --from=client-build --chown=nodejs:nodejs /app/client/build ./client/build

# Create uploads directory
RUN mkdir -p /app/uploads && chown nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node server/healthcheck.js

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/server.js"]