# Use Node.js as base image
FROM node:20-alpine

# Install git for development purposes
RUN apk add --no-cache git

# Create app directory and set permissions
WORKDIR /app/client
RUN chown -R node:node /app/client

# Use alpine's non-root user
USER node

# Install npm dependencies
COPY package*.json ./
RUN npm install