# U-Speak STEM: one image serves the page, the shared sim, and the Colyseus server.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=2568

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund

COPY shared ./shared
COPY client ./client
COPY server ./server

RUN mkdir -p /app/server/data && chown -R node:node /app
USER node

EXPOSE 2568
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:2568/healthz >/dev/null || exit 1

WORKDIR /app/server
CMD ["node", "src/index.js"]
