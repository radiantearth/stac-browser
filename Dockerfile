ARG pathPrefix="/"

FROM node:lts-alpine AS build-step
ARG DYNAMIC_CONFIG=true
ARG historyMode="history"
ARG pathPrefix
ARG SB_CONFIG=""
ENV SB_historyMode="${historyMode}"
ENV SB_pathPrefix="${pathPrefix}"
ENV SB_CONFIG="${SB_CONFIG}"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN \[ "${DYNAMIC_CONFIG}" == "true" \] && sed -i 's/<!--RC//;s/RC-->//' index.html
RUN npm run build


FROM nginxinc/nginx-unprivileged:1-alpine
ARG pathPrefix

USER root
RUN apk add --no-cache jq pcre-tools

COPY ./config.schema.json /etc/nginx/conf.d/config.schema.json
COPY --from=build-step /app/dist /usr/share/nginx/html
COPY --from=build-step /app/docker/default.conf /etc/nginx/conf.d/default.conf
ADD docker/docker-entrypoint.sh /docker-entrypoint.d/40-stac-browser-entrypoint.sh

RUN barePrefix=$(printf '%s' "${pathPrefix}" | sed 's|/*$||') && \
    if [ -n "${barePrefix}" ]; then \
      sed -i "s|<prefixRedirect>|location = ${barePrefix} { return 301 ${barePrefix}/\$is_args\$args; }|" /etc/nginx/conf.d/default.conf; \
    else \
      sed -i '/<prefixRedirect>/d' /etc/nginx/conf.d/default.conf; \
    fi && \
    sed -i "s|<pathPrefix>|${pathPrefix}|" /etc/nginx/conf.d/default.conf && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod +x /docker-entrypoint.d/40-stac-browser-entrypoint.sh

EXPOSE 8080

STOPSIGNAL SIGTERM

USER nginx
