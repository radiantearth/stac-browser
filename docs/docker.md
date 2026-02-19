# Docker

Note: Docker might not be an ideal way to deploy STAC Browser in production. Consider using a web host, cloud storage, or a CDN.

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
- **[`pathPrefix`](docs/options.md#pathprefix)**: Base URL path (what users see in browser). Default: `/`
- **[`servePath`](docs/options.md#servepath)**: Server path (what the web server receives after proxy). Default: same as `pathPrefix`
- **[`historyMode`](docs/options.md#historymode)**: Router history mode

**Examples:**

```bash
# Regular root deployment
docker build -t stac-browser:v1 --build-arg historyMode=hash .

# Direct exposure or non-stripping proxy: serve at /browser/, users see /browser/
docker build -t stac-browser:v1 --build-arg pathPrefix="/browser/" .

# Path-stripping proxy: proxy strips /browser/, server receives /, users see /browser/
docker build -t stac-browser:v1 --build-arg pathPrefix="/browser/" --build-arg servePath="/" .
```

All other options, except the ones that are explicitly excluded from CLI/ENV usage,
can be passed as environment variables when running the container.
For example, to run the container with a pre-defined
[`catalogUrl`](docs/options.md#catalogurl) and [`catalogTitle`](docs/options.md#catalogtitle):

```bash
docker run -p 8080:8080 -e SB_catalogUrl="https://earth-search.aws.element84.com/v1/" -e SB_catalogTitle="Earth Search" stac-browser:v1
```


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

## How it works

The docker image uses a multi stage build.
The first stage is based on a node image and runs `npm build` to produce a `/dist` folder with static files (HTML, CSS, and JavaScript).
The second stage is based on an nginx image that serves the static files at the configured `servePath`.
So, essentially, in the end you get an nginx instance that serves static files.

## Essential parts

1. [Dockerfile](../Dockerfile) - contains information on how to build the image.
2. [docker/default.conf](../docker/default.conf) - nginx configuration template, where `<servePath>` is replaced during build.
3. [docker/docker-entrypoint.sh](../docker/docker-entrypoint.sh) - a start script to read the passed variables and produce the `runtime-config.js` file.

## FAQ

> Can I use `ghcr.io/radiantearth/stac-browser` image with the `pathPrefix`?

You can not. You need to build your own image because `pathPrefix` is a build-only option.

> How do I specify `buildTileUrlTemplate` via docker env?

You can not. Consider modifying the dockerfile and using a custom `config.js` file (or `runtime-config.js` for runtime configuration)
