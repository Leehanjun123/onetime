# Multi-stage build for production - OneTime Frontend
FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    ca-certificates \
    tzdata && \
    rm -rf /var/cache/apk/*

# Set timezone to KST for Korean operations
ENV TZ=Asia/Seoul

# Create non-root user for security
RUN addgroup -g 1001 -S onetime && \
    adduser -S onetime -u 1001 -G onetime

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev --silent && npm cache clean --force

# Builder stage
FROM base AS builder
COPY package*.json ./
RUN npm ci --silent

COPY . .

# Build arguments for different environments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_ENVIRONMENT=production

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage - Optimized for Korean cloud providers
FROM base AS production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create application directories
RUN mkdir -p /app/.next /app/public && \
    chown -R onetime:onetime /app

# Switch to non-root user
USER onetime

WORKDIR /app

# Copy built application
COPY --from=deps --chown=onetime:onetime /app/node_modules ./node_modules
COPY --from=builder --chown=onetime:onetime /app/.next/standalone ./
COPY --from=builder --chown=onetime:onetime /app/.next/static ./.next/static
COPY --from=builder --chown=onetime:onetime /app/public ./public

# Security labels for Korean compliance
LABEL maintainer="OneTime DevOps Team" \
      version="1.0" \
      description="OneTime Frontend - Korean Financial Services Compliant" \
      vendor="OneTime" \
      security.compliance="K-ISMS,PIPA" \
      cloud.provider="naver,kt,aws"

# Expose port
EXPOSE 3000

# Health check for Korean financial services requirements
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly in K8s
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]