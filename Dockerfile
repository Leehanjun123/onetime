# Multi-stage build for production
FROM node:18-alpine AS builder

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Production image
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/.env.example ./.env.example

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]