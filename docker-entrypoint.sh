#!/bin/sh
# vim:sw=4:ts=4:et

str_or_null() {
    if [ -z "$1" ]
    then
        echo "null"
    else
        echo "'$1'"
    fi
}

object_or_null() {
    if [ -z "$1" ]
    then
        echo "null"
    else
        echo "$1"
    fi
}

bool() {
    case "$1" in
        true | TRUE | yes | t | True)
            echo true ;;
        false| FALSE | no | n | False)
            echo false ;;
        *)
            echo "Err: Unknown boolean value \"$1\"" 1>&1; exit 1 ;;
    esac
}

str_list() {
    if [ -z "$1" ]
    then
        echo "[]"
    else
        echo "['$(echo $1 | sed "s/,/', '/g")']"
    fi
}

object_list_or_null() {
    if [ -z "$1" ]
    then
        echo "null"
    else
        echo "[$(echo $1 | sed "s/,/, /g")]"
    fi
}

cat >/usr/share/nginx/html/config.js <<EOF
window.STAC_BROWSER_CONFIG = {
    catalogUrl: $(str_or_null $CATALOG_URL),
    catalogTitle: '${CATALOG_TITLE}',
    allowExternalAccess: $(bool $ALLOW_EXTERNAL_ACCESS),
    allowedDomains: $(str_list $ALLOWED_DOMAINS),
    detectLocaleFromBrowser: $(bool $DETECT_LOCALE_FROM_BROWSER),
    storeLocale: $(bool $STORE_LOCALE),
    locale: '${LOCALE}',
    fallbackLocale: '${FALLBACK_LOCALE}',
    supportedLocales: $(str_list $SUPPORTED_LOCALES),
    apiCatalogPriority: $(str_or_null $API_CATALOG_PRIORITY),
    useTileLayerAsFallback: $(bool $USE_TILE_LAYER_AS_FALLBACK),
    displayGeoTiffByDefault: $(bool $DISPLAY_GEOTIFF_BY_DEFAULT),
    buildTileUrlTemplate: ${BUILD_URL_TEMPLATE},
    stacProxyUrl: $(str_or_null $STAC_PROXY_URL),
    cardViewMode: $(str_or_null $CARD_VIEW_MODE),
    cardViewSort: $(str_or_null $CARD_VIEW_SORT),
    showThumbnailsAsAssets: $(bool $SHOW_THUMBNAILS_AS_ASSETS),
    stacLint: $(bool $STAC_LINT),
    geoTiffResolution: ${GEO_TIFF_RESOLUTION},
    redirectLegacyUrls: $(bool $REDIRECT_LEGACY_URLS),
    itemsPerPage: ${ITEM_PER_PAGE},
    defaultThumbnailSize: $(object_list_or_null $DEFAULT_THUMBNAIL_SIZE),
    maxPreviewsOnMap: ${MAX_PREVIEWS_ON_MAP},
    crossOriginMedia: $(str_or_null $CROSS_ORIGIN_MEDIA),
    requestHeaders: $(object_or_null $REQUEST_HEADERS),
    requestQueryParameters: $(object_or_null $REQUEST_QUERY_PARAMETERS),
    preprocessSTAC: $(object_or_null $PREPROCESS_STAC),
    authConfig: $(object_or_null $AUTH_CONFIG),
}
EOF
