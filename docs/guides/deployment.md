# 배포 가이드 (Deployment Guide)

이 가이드는 UJAX 프론트엔드 애플리케이션을 빌드하고 배포하는 방법을 설명합니다.

## 1. 프로덕션 빌드 (Production Build)

최적화된 프로덕션 빌드(`/dist`)를 생성하려면:

```bash
npm run build
```

결과물은 `/dist` 디렉토리에 생성됩니다. 이 디렉토리는 정적 파일(HTML, CSS, JS)을 포함하며 모든 웹 서버에서 제공될 수 있습니다.

### 로컬 미리보기 (Preview Locally)
배포 전에 로컬에서 프로덕션 빌드를 테스트하려면:

```bash
npm run preview
```

## 2. 플랫폼 가이드 (Platform Guides)

### Vercel / Netlify (프론트엔드 전용 추천)
1. **프로젝트 가져오기**: `ujax-front` 저장소를 선택합니다.
2. **프레임워크 프리셋**: Vite
3. **빌드 명령어**: `npm run build`
4. **출력 디렉토리**: `dist`
5. **환경 변수**: 필요한 경우 `VITE_API_BASE_URL`을 설정합니다.

---

## 3. 커스텀 배포 (Docker + Nginx)

직접 호스팅하거나 백엔드 서버와 통합하려면 Docker와 Nginx를 사용하세요.

### `Dockerfile` 예시

루트 디렉토리에 `Dockerfile` 파일을 생성하세요:

```dockerfile
# 단계 1: 빌드
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 단계 2: 서빙 (Serve)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `nginx.conf` 예시

SPA 라우팅 및 API 프록싱을 위한 `nginx.conf` 파일을 생성하세요:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPA 라우팅 (History API 폴백)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (선택 사항)
    location /api/ {
        proxy_pass http://backend-service:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker 컨테이너 빌드 및 실행

```bash
docker build -t ujax-front .
docker run -p 80:80 ujax-front
```
