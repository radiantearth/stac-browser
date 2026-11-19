FROM node:lts-alpine AS build-step
ARG historyMode="history"
ARG SB_CONFIG=""
ARG SB_RUNTIME=true
ENV SB_historyMode="${historyMode}"
ENV SB_CONFIG="${SB_CONFIG}"
ENV SB_RUNTIME="${SB_RUNTIME}"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM caddy:2-alpine
ARG pathPrefix="/"

RUN apk add --no-cache ca-certificates curl jq

COPY ./config.schema.json /etc/stac-browser/config.schema.json
COPY --from=build-step --chown=101:0 /app/dist /usr/share/stac-browser
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --chmod=755 docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# The entrypoint rewrites index.html and runtime-config.js at startup.
# Group-writable so that it also works with arbitrary user IDs in the root group (e.g. OpenShift).
RUN chmod g+w /usr/share/stac-browser

ENV SB_pathPrefix="${pathPrefix}"
# Port inside the container
ENV PORT=8080
EXPOSE 8080

USER 101

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
