# Docker <!-- omit in toc -->

- [Which approach should I choose?](#which-approach-should-i-choose)
- [Create a custom image](#create-a-custom-image)
- [Use an existing image](#use-an-existing-image)
- [How it works](#how-it-works)
- [Essential parts](#essential-parts)
- [FAQ](#faq)

> [!NOTE]  
> Docker might not be the ideal way to deploy STAC Browser in production.
> Also consider using a web host, cloud storage, or a CDN.

## Which approach should I choose?

There are three ways to deploy STAC Browser with Docker, with increasing flexibility and effort:

1. **Use the [pre-built image](#use-an-existing-image)** (`ghcr.io/radiantearth/stac-browser`) —
   the quickest way to get a STAC Browser running for your catalog.
   You can configure it through environment variables and adjust
   [colors, fonts and a few other styles](./styling.md#runtime-customizations)
   through a mounted CSS file — all without building anything.
   Choose this to evaluate STAC Browser or when configuration plus a lightly branded look is enough.
   *Limitations:* must be served from the domain root (no `pathPrefix`), and nothing that
   requires code — no function-valued options, custom widgets/actions, new languages,
   or full theming.

2. **[Build a custom image](#create-a-custom-image)** from an (unmodified) copy of this repository —
   a single `docker build` command. This additionally unlocks the build-only options
   (`pathPrefix`, `historyMode`), an external config file with function-valued options via
   `SB_CONFIG`, and full theming via the Sass files in [`src/theme/`](../src/theme/).
   Additionally, it allows for custom [widgets](./widgets.md), [actions](./actions.md),
   [code generators](./code-generators.md), [metadata field rules](./metadata.md),
   additional [languages](./localization.md), or code-based
   [basemap logic](./basemaps.md).
   Choose this for production deployments if you need any of the features above.

See the [customization overview](../README.md#customize) for a
feature-by-feature comparison. When in doubt, start with the pre-built image.
You can always switch to a custom build later, the configuration stays the same.

## Create a custom image

Building the Dockerfile without changing any build options:

```bash
docker build -t stac-browser:v1 .
```

Run the container for a specific URL:

```bash
docker run -p 8080:8080 -e SB_catalogUrl="https://earth-search.aws.element84.com/v1/" stac-browser:v1
```

STAC Browser is now available at `http://localhost:8080`

---

You can pass further options to STAC Browser to customize it to your needs.

The build-only options
[`historyMode`](./options.md#historymode)
and `SB_CONFIG` (for loading an [external config file](./options.md))
can be provided as a
[build argument](https://docs.docker.com/engine/reference/commandline/build#set-build-time-variables---build-arg)
when building the Dockerfile.

Another build argument is `SB_RUNTIME` (default: `true`).
When enabled, the built image loads two optional files at startup:

- `runtime-config.js` — lets you set options (like `catalogUrl`) without rebuilding the image (see [Options](./options.md)).
- `runtime-style.css` — lets you drop in a CSS file to adjust the look and feel without rebuilding the image (see [Styling & Theming](./styling.md#runtime-customizations)).

If you set `SB_RUNTIME=false` at build time, the runtime files are not loaded and everything must be configured at build time instead.
If you don't use runtime config and runtime styles, you can save two server roundtrips by disabling this option, making the initial page load slightly faster.

For example:

```bash
docker build -t stac-browser:v1 --build-arg historyMode=hash .
```

`SB_CONFIG` lets you overlay a custom config module (e.g. for options like
[`preprocessSTAC`](./options.md#preprocessstac) that can only be set in a config file)
without modifying the Dockerfile:

```bash
docker build -t stac-browser:v1 --build-arg SB_CONFIG=./config.custom.mjs .
```

All other options, except the ones that are explicitly excluded from CLI/ENV usage,
can be passed as environment variables when running the container.
For example, to run the container with a pre-defined
[`catalogUrl`](./options.md#catalogurl) and [`catalogTitle`](./options.md#catalogtitle):

```bash
docker run -p 8080:8080 -e SB_catalogUrl="https://earth-search.aws.element84.com/v1/" -e SB_catalogTitle="Earth Search" stac-browser:v1
```

[`pathPrefix`](./options.md#pathprefix) can also be set at container startup via `SB_pathPrefix` (when `SB_RUNTIME` is enabled, the default):

```bash
docker run -p 8080:8080 -e SB_pathPrefix="/browser/" -e SB_catalogUrl="https://earth-search.aws.element84.com/v1/" stac-browser:v1
```

If you want to pass all the other arguments to `npm run build` directly, you can modify to the Dockerfile as needed.

STAC Browser is now available at `http://localhost:8080/browser/`.
Requests to `http://localhost:8080/browser` (no trailing slash) are redirected there.

## Use an existing image

Since version 3.1.1, you can add an existing image from [Packages](https://github.com/radiantearth/stac-browser/pkgs/container/stac-browser) to your docker-compose.yml:

```yaml
services:
  stac-browser:
    image: ghcr.io/radiantearth/stac-browser:latest
    ports:
      - 8080:8080
    environment:
      SB_catalogUrl: "https://localhost:7188"
```

With the pre-built image you can customize, without rebuilding:

- **All non-build-only options** via `SB_*` environment variables (see [Options](./options.md)),
  including [custom basemaps](./basemaps.md) via `SB_basemaps`.
- **The styling** (colors, fonts, and more) by mounting your own `runtime-style.css`
  (see [Styling & Theming](./styling.md#runtime-customizations)):

```yaml
services:
  stac-browser:
    image: ghcr.io/radiantearth/stac-browser:latest
    ports:
      - 8080:8080
    environment:
      SB_catalogUrl: "https://localhost:7188"
    volumes:
      - ./my-style.css:/usr/share/nginx/html/runtime-style.css:ro
```

Anything that requires code — custom widgets, actions, function-valued options such as
`preprocessSTAC`, new languages, or a fully customized theme — requires
[building a custom image](#create-a-custom-image).

## How it works

The docker image uses a multi stage build.
The first stage is based on a node image and runs `npm run build` to produce a `/dist` folder with static files (HTML, CSS, and JavaScript).
The second stage is based on an nginx image that serves the folder with static files. At startup, the entrypoint applies `SB_pathPrefix` to nginx and generates `runtime-config.js`.
So, essentially, in the end you get an nginx instance that serves static files.

## Essential parts

1. [Dockerfile](../Dockerfile) - contains information on how to build the image.
2. [docker/default.conf](../docker/default.conf) - nginx configuration template; `${STAC_PATH_PREFIX}` is substituted at startup.
3. [docker/docker-entrypoint.sh](../docker/docker-entrypoint.sh) - a start script to read the passed variables, render the nginx config, and produce the `runtime-config.js` file.

## FAQ

> Can I use `ghcr.io/radiantearth/stac-browser` image with the `pathPrefix`?

Yes — pass `-e SB_pathPrefix="/browser/"` at container startup. See [`pathPrefix`](./options.md#pathprefix).

> How do I specify `buildTileUrlTemplate` via docker env?

You can not. Consider modifying the dockerfile and using a custom `config.js` file (or `runtime-config.js` for runtime configuration)
