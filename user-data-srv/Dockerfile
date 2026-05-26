FROM node:18-alpine
LABEL org.opencontainers.image.title="RustAdmin Service"
LABEL org.opencontainers.image.description="RustAdmin backend service - fork of RustMon"
LABEL org.opencontainers.image.source="https://github.com/DEIN_USERNAME/RustAdmin"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts && npm ci
COPY . .
RUN npm run build
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ping || exit 1
CMD ["npm", "run", "start:prod"]
