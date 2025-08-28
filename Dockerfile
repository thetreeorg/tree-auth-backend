# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port (default NestJS port)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
