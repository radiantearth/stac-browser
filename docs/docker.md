# Docker details

Note: Docker might not be an ideal way to deploy stac browser in production. Consider using cloud storage and CDN. 

# How it works
The docker image uses multi stage build.
The first stage is based on a node image and runs `npm build` to produce a /dist dir with static files.
The second stage is based on nginx image that serves the folder with static files and deals with `pathPrefix` arg.
So, essentialy, in the end you get an nginx instance that serves static files.

# Essential parts
1. Dockerfile - contains information on how to build the image.
2. /docker/default.conf - nginx configuration template, where `<pathPrefix>` var is replaced during build.
3. /docker/docker-entrypoint.sh - a start script to read the passed variables and produce `config.js` file.

# FAQ
> Can I use `ghcr.io/radiantearth/stac-browser` image with the `pathPrefix`?

You can not. You need to build your own image because `pathPrefix` is a build only param.

> How do I specify `buildTileUrlTemplate` via docker env?

You can not. Consider modifying the dockerfile and using a custom `config.js` file