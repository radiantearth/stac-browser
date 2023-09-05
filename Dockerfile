FROM node:lts-alpine3.18 AS build-step
ARG DYNAMIC_CONFIG=true

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN \[ "${DYNAMIC_CONFIG}" == "true" \] && sed -i 's/<!-- <script defer="defer" src=".\/config.js"><\/script> -->/<script defer="defer" src=".\/config.js"><\/script>/g' public/index.html
RUN npm run build


FROM nginx:1-alpine-slim

COPY --from=build-step /app/dist /usr/share/nginx/html
COPY ./config.schema.json /etc/nginx/conf.d/config.schema.json

# change default port to 8080
RUN apk add jq pcre-tools && \
    sed -i 's/\s*listen\s*80;/    listen 8080;/' /etc/nginx/conf.d/default.conf && \
    sed -i 's/\s*location \/ {/    location \/ {\n        try_files $uri $uri\/ \/index.html;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080

STOPSIGNAL SIGTERM

# override entrypoint, which calls nginx-entrypoint underneath
ADD docker/docker-entrypoint.sh /docker-entrypoint.d/40-stac-browser-entrypoint.sh
