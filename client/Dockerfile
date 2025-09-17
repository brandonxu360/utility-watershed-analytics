# Use Node.js as base image
FROM node:20-alpine

# Install git for development purposes
RUN apk add --no-cache git

# Create app directory
WORKDIR /app/client

# Get npm dependencies
COPY package*.json ./
RUN chown -R node:node /app/client

# Use alpine's non-root user
USER node

# Install npm dependencies
RUN npm install

# Development server will be started via command in compose
# No need to copy source code since it's mounted as volume