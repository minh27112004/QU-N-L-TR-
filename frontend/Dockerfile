# Stage 1: Build React App
FROM node:22-slim AS build

WORKDIR /app

# Copy package descriptors and lockfile
COPY package*.json ./

# Install dependencies (use npm install to avoid compile time issues)
RUN npm install

# Copy source code
COPY . .

# Set dynamic API URL env parameter (routed through Nginx proxy)
ENV VITE_API_URL=/api

# Build production bundle
RUN npm run build

# Stage 2: Serve React App with Nginx
FROM nginx:alpine

# Copy build artifacts to Nginx server root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
