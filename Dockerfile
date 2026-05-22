FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=optional

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --include=optional

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

EXPOSE 3000
CMD ["node", "server.js"]
