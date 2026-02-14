# Deployment Guide

This guide explains how to build and deploy the UJAX Frontend application.

## 1. Production Build

To generate the optimized production build (`/dist`):

```bash
npm run build
```

The output will be in the `/dist` directory. This directory contains static files (HTML, CSS, JS) that can be served by any web server.

### Preview Locally
To test the production build locally before deploying:

```bash
npm run preview
```

## 2. Platform Guides

### Vercel / Netlify (Recommended for Frontend-only)
1. **Import Project**: Select the `ujax-front` repository.
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: Set `VITE_API_BASE_URL` if needed.

---

## 3. Custom Deployment (Docker + Nginx)

For self-hosting or integration with a backend server, use Docker with Nginx.

### `Dockerfile` Example

Create a file named `Dockerfile` in the root directory:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `nginx.conf` Example

Create a file named `nginx.conf` for SPA routing and API proxying:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPA Routing (History API Fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy (Optional)
    location /api/ {
        proxy_pass http://backend-service:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Build & Run Docker Container

```bash
docker build -t ujax-front .
docker run -p 80:80 ujax-front
```
