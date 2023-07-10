FROM node:lts-alpine AS build-step
ARG DYNAMIC_CONFIG=false

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN \[ "${DYNAMIC_CONFIG}" == "true" \] && sed -i 's/<!-- <script defer="defer" src=".\/config.js"><\/script> -->/<script defer="defer" src=".\/config.js"><\/script>/g' public/index.html
RUN npm run build -- --catalogUrl=$catalogURL


FROM nginx:alpine-slim

ENV CATALOG_URL= \
    CATALOG_TITLE="STAC Browser" \
    ALLOW_EXTERNAL_ACCESS=true \
    ALLOWED_DOMAINS= \
    DETECT_LOCALE_FROM_BROWSER=true \
    STORE_LOCALE=true \
    LOCALE=en \
    FALLBACK_LOCALE=en \
    SUPPORTED_LOCALES=de,es,en,fr,it,ro \
    API_CATALOG_PRIORITY= \
    USE_TILE_LAYER_AS_FALLBACK=true \
    TILE_SOURCE_TEMPLATE=null \
    DISPLAY_GEOTIFF_BY_DEFAULT=false \
    BUILD_URL_TEMPLATE='({href, asset}) => "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=" + encodeURIComponent(asset.href.startsWith("/vsi") ? asset.href : href)' \
    STAC_PROXY_URL= \
    CARD_VIEW_MODE=cards \
    CARD_VIEW_SORT=asc \
    SHOW_THUMBNAILS_AS_ASSETS=false \
    STAC_LINT=true \
    GEO_TIFF_RESOLUTION=128 \
    REDIRECT_LEGACY_URLS=false \
    ITEM_PER_PAGE=12 \
    DEFAULT_THUMBNAIL_SIZE= \
    MAX_PREVIEWS_ON_MAP=50 \
    CROSS_ORIGIN_MEDIA= \
    REQUEST_HEADERS='{}' \
    REQUEST_QUERY_PARAMETERS='{}' \
    PREPROCESS_STAC= \
    AUTH_CONFIG=

COPY --from=build-step /app/dist /usr/share/nginx/html

# change default port to 8080
RUN sed -i 's/\s*listen\s*80;/    listen 8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080

STOPSIGNAL SIGTERM

# override entrypoint, which calls nginx-entrypoint underneath
ADD docker-entrypoint.sh /docker-entrypoint.d/40-stac-fastapi-entrypoint.sh
