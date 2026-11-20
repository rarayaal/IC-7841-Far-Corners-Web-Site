# Etapa 1: instalar dependencias y compilar TypeScript
FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Etapa 2: preparar la aplicación para ejecutarse
FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

RUN mkdir -p /home/node/.cache/farcorners-mymemory \
    && chown -R node:node /home/node/.cache

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]