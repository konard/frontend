# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:22-slim AS builder

# Устанавливаем yarn 4.x (berry)
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY stylist-svelte/package.json stylist-svelte/yarn.lock stylist-svelte/.yarnrc.yml ./stylist-svelte/
COPY frontend/package.json frontend/yarn.lock frontend/.yarnrc.yml ./frontend/

WORKDIR /app/stylist-svelte
RUN yarn install --frozen-lockfile

# Build the local component library before frontend installs file:../stylist-svelte
COPY stylist-svelte/. .
RUN yarn build

WORKDIR /app/frontend
RUN yarn install --no-immutable

# Copy source code from frontend subdirectory
COPY frontend/. .

# Генерируем SvelteKit конфигурацию
RUN npx svelte-kit sync

# Build arguments for VITE environment variables
ARG VITE_GRAPHQL_ENDPOINT=http://localhost:8000/graphql
ARG VITE_APP_ENV=production
ARG VITE_APP_URL=http://localhost:5173
ARG VITE_DEBUG=false

# Set environment variables for build
ENV VITE_GRAPHQL_ENDPOINT=${VITE_GRAPHQL_ENDPOINT}
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_APP_URL=${VITE_APP_URL}
ENV VITE_DEBUG=${VITE_DEBUG}

# Build the application
RUN yarn build

# Stage 2: Production
FROM node:22-slim

# Устанавливаем yarn 4.x (berry)
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

WORKDIR /app

# Copy package files and the built local component library without builder node_modules
COPY frontend/package.json frontend/yarn.lock frontend/.yarnrc.yml ./frontend/
COPY --from=builder /app/stylist-svelte/package.json ./stylist-svelte/package.json
COPY --from=builder /app/stylist-svelte/dist ./stylist-svelte/dist

WORKDIR /app/frontend
# Install dependencies against the local file:../stylist-svelte package
RUN yarn install --no-immutable

# Copy built application from builder
COPY --from=builder /app/frontend/build ./build

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Start the application
CMD ["node", "build"]
