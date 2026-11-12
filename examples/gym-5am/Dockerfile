# Wellness Fitness 5AM — imagen de producción (sin dependencias de npm).
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    DATA_DIR=/data \
    TZ=America/Mexico_City \
    SECURE_COOKIES=1 \
    TRUST_PROXY=1

WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node lib ./lib
COPY --chown=node:node public ./public

# La base de datos y las copias de seguridad viven en un volumen persistente.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "--no-warnings", "server.mjs"]
