ARG pathPrefix="/"
ARG servePath=""

FROM node:lts-alpine3.18 AS build-step
ARG DYNAMIC_CONFIG=true
ARG historyMode="history"
ARG pathPrefix
ENV SB_historyMode="${historyMode}"
ENV SB_pathPrefix="${pathPrefix}"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN \[ "${DYNAMIC_CONFIG}" == "true" \] && sed -i "s|<!-- <script defer=\"defer\" src=\"/runtime-config.js\"></script> -->|<script defer=\"defer\" src=\"${pathPrefix}runtime-config.js\"></script>|g" index.html
RUN npm run build


FROM nginxinc/nginx-unprivileged:1-alpine
ARG pathPrefix
ARG servePath

USER root
RUN apk add --no-cache jq pcre-tools

COPY ./config.schema.json /etc/nginx/conf.d/config.schema.json
COPY --from=build-step /app/dist /usr/share/nginx/html
COPY --from=build-step /app/docker/default.conf /etc/nginx/conf.d/default.conf
ADD docker/docker-entrypoint.sh /docker-entrypoint.d/40-stac-browser-entrypoint.sh

RUN SERVE_PATH="${servePath:-$pathPrefix}" && \
    sed -i "s|<servePath>|${SERVE_PATH}|g" /etc/nginx/conf.d/default.conf && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod +x /docker-entrypoint.d/40-stac-browser-entrypoint.sh

EXPOSE 8080

STOPSIGNAL SIGTERM

USER nginx
