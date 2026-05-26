### STAGE 1: Build ###
FROM node:18-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run buildprod

### STAGE 2: Run ###
FROM nginx:alpine
LABEL org.opencontainers.image.title="RustAdmin"
LABEL org.opencontainers.image.description="Rust server admin panel - fork of RustMon"
LABEL org.opencontainers.image.source="https://github.com/DEIN_USERNAME/RustAdmin"
COPY --from=build /usr/src/app/dist/rustmon /usr/share/nginx/html
COPY --from=build /usr/src/app/nginx.default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
