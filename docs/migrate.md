# Migrate

## v1 and v2 to v3

If you are running an old (standalone) version of STAC Browser (v1 or v2) without heavy modifications,
you can usually migrate easily to v3.

The old environment variables have changed names. See [environment variables](#environment-variables) for details.
The names of the environment variables have slightly changed:
* `CATALOG_URL` => `SB_catalogUrl`
* `STAC_PROXY_URL` => `SB_stacProxyUrl` (same in CLI, different format in the config file)
* `TILE_PROXY_URL` / `TILE_SOURCE_TEMPLATE` => only available via config file, this is not a 1:1 replacement, make sure to read the documentation for `buildTileUrlTemplate`
* `PATH_PREFIX` => `SB_pathPrefix`
* `HISTORY_MODE` => `SB_historyMode`

You should also enable `redirectLegacyUrls` which makes sure that your old URLs are correctly parsed by STAC Browser v3 and links to the old version of STAC Browser don't get broken.

All other options you can customize to your liking.

Then simply deploy STAC Browser to the same location where you hosted STAC Browser v1/v2 before.
