# --- Build stage: compile the React app with Vite ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached unless deps change.
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .

# Backend URL the browser calls; overridable at build time.
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# --- Serve stage: static files via nginx ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
