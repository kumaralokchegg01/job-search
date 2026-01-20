# Frontend Dockerfile for JobIntel
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY tailwind.config.ts postcss.config.js vite.config.ts ./
COPY components.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY index.html ./
COPY public ./public
COPY src ./src

# Build application
RUN npm run build

# Production stage - use nginx for proper API proxying
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built files from builder
COPY --from=builder /app/dist .

# Copy nginx config for SPA and API proxying
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
