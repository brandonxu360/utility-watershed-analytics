# Use Node.js as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# We use volume mount instead of copy
# COPY . .

# Start development server
CMD ["npm", "run", "dev"]