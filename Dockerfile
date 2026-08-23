# --- build stage ---
# Node 20, not 22: better-sqlite3@12 (pinned for compatibility with the dev machine's Node 20)
# has no musl/Alpine prebuild, so it must compile from source — and node-gyp on node:22-alpine
# specifically produces a better_sqlite3.node that needs a shared libnode.so.115 the image
# doesn't ship ("Error loading shared library libnode.so.115"), even though the exact same
# from-source build works fine on node:20-alpine. Verified directly against both images.
FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --build-from-source
COPY . .
RUN npm run build && npm prune --omit=dev

# --- runtime stage ---
FROM node:20-alpine
RUN apk add --no-cache vips
ENV NODE_ENV=production DATA_DIR=/data PORT=3000 BODY_SIZE_LIMIT=524288000
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "build"]
