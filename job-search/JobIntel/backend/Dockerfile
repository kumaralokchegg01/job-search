# Backend Dockerfile for JobIntel
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV MONGODB_URI=mongodb://mongo:27017/jobintel

# Start application
CMD ["npm", "start"]
