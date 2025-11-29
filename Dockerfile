# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Accept the API key as a build argument
ARG GEMINI_API_KEY
# Make it available as an environment variable
ENV GEMINI_API_KEY=$GEMINI_API_KEY

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application
FROM node:18-alpine
WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary files to run the preview server
COPY package*.json ./
COPY vite.config.ts ./
# We need the dependencies for vite to run the preview server
RUN npm install --omit=dev

# Expose the port the app runs on
EXPOSE 3010

# Run the app
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3010"]
