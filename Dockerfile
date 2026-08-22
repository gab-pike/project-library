# --- build stage ---
FROM node:22-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# --- runtime stage ---
FROM node:22-alpine
RUN apk add --no-cache vips
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "build"]
