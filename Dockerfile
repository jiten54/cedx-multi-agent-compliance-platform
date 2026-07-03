# Use standard Node.js LTS lightweight Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency catalogs
COPY package*.json ./

# Install packages
RUN npm install

# Copy full codebase
COPY . .

# Build Vite client static files and esbuild compile TS backend
RUN npm run build

# Expose port 3000 for standard routing
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start compiled CommonJS server.ts bundle
CMD ["npm", "run", "start"]
