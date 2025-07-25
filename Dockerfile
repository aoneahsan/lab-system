# Multi-stage build for optimal image size

# Stage 1: Build the application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_FIREBASE_DATABASE_URL

RUN yarn build

# Stage 2: Serve the application
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /var/www/labflow/dist

# Create non-root user
RUN addgroup -g 1001 -S labflow && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G labflow -g labflow labflow && \
    chown -R labflow:labflow /var/www/labflow && \
    chown -R labflow:labflow /var/cache/nginx && \
    chown -R labflow:labflow /var/log/nginx && \
    chown -R labflow:labflow /etc/nginx/conf.d

# Create nginx pid directory
RUN mkdir -p /var/run/nginx && \
    chown -R labflow:labflow /var/run/nginx

# Update nginx config to run as non-root
RUN echo "pid /var/run/nginx/nginx.pid;" >> /etc/nginx/nginx.conf

# Switch to non-root user
USER labflow

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]