# Migrate

## v1 and v2 to v3

If you are running an old (standalone) version of STAC Browser (v1 or v2) without heavy modifications,
you can usually migrate easily to v3.

The old environment variables have changed names. See [the options page](options.md) for details.
The names of the environment variables have slightly changed:

* `CATALOG_URL` => `SB_catalogUrl`
* `TILE_PROXY_URL` / `TILE_SOURCE_TEMPLATE` => only available via config file, this is not a 1:1 replacement, make sure to read the documentation for `buildTileUrlTemplate`
* `PATH_PREFIX` => `SB_pathPrefix`
* `HISTORY_MODE` => `SB_historyMode`

All other options you can customize to your liking.

Then simply deploy STAC Browser to the same location where you hosted STAC Browser v1/v2 before.
