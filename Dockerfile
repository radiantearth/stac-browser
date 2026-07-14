FROM node:lts-alpine AS build-step
ARG runtimeConfig=true
ARG historyMode="history"
ARG SB_CONFIG=""
ENV SB_runtimeConfig="${runtimeConfig}"
ENV SB_historyMode="${historyMode}"
ENV SB_CONFIG="${SB_CONFIG}"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM nginxinc/nginx-unprivileged:1-alpine
ARG pathPrefix="/"

USER root
RUN apk add --no-cache jq pcre-tools

COPY ./config.schema.json /etc/nginx/conf.d/config.schema.json
COPY --from=build-step /app/dist /usr/share/nginx/html
COPY --from=build-step /app/docker/default.conf /etc/nginx/conf.d/default.conf.template
ADD docker/docker-entrypoint.sh /docker-entrypoint.d/40-stac-browser-entrypoint.sh

# Remove the base image's default server config so nginx fails loudly if the
# entrypoint (which renders default.conf.template) is bypassed, instead of
# silently serving the stock nginx welcome page.
RUN rm -f /etc/nginx/conf.d/default.conf && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod +x /docker-entrypoint.d/40-stac-browser-entrypoint.sh

ENV SB_pathPrefix="${pathPrefix}"

EXPOSE 8080

STOPSIGNAL SIGTERM

USER nginx
