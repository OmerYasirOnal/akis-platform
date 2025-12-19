# AKIS GitHub MCP Gateway Dockerfile
# Minimal Node.js image for HTTP-to-stdio MCP bridge

FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm install typescript tsx @types/node && \
    npm run build && \
    npm uninstall typescript tsx @types/node && \
    npm prune --production

# Expose port
EXPOSE 4010

# Run gateway
CMD ["node", "dist/server.js"]

