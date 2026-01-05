# Using Local Files

Web browser security settings prevent web pages from accessing local files using the normal request model. The solution is to serve the files from a local webserver. The following examples show `catalog.json` as the name of the local catalog you wish to browse - substitute the name of your catalog file if it is different.

## Using STAC Browser from source

If you are accessing STAC Browser by running the `npm start` command, you can run a local webserver using the [`http-server`](https://www.npmjs.com/package/http-server) package.

Install and run `http-server` via the following command from the directory that contains the STAC files:

```js
npx http-server -p 8000 --cors
```

You can then set the environment variable `SB_catalogUrl` to `"http://localhost:8000/catalog.json"` when starting STAC Browser.

## Using STAC Browser somewhere else

If you are using a hosted version of STAC Browser, such as the [STAC Browser Demo by Radiant Earth](https://radiantearth.github.io/stac-browser/),  and your STAC files use relative URIs, you can run a local webserver. One possibility is to use the Node package described above. Another is to use this Python 3 script:

```python
#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler, test
import sys

class CORSRequestHandler (SimpleHTTPRequestHandler):
    def end_headers (self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

if __name__ == '__main__':
    test(CORSRequestHandler, HTTPServer, port=int(sys.argv[1]) if len(sys.argv) > 1 else 8000)
```

Save this script and run it from the directory that has your STAC Catalog. You can then use `http://localhost:8000/catalog.json` as the URL to your STAC file.

## stactools

If the above options don't work for you, you can run a fully-featured implementation of STAC Browser locally using the [stactools-browse](https://github.com/stactools-packages/browse) package for [stactools](https://github.com/stac-utils/stactools). One short command gives you:

- STAC Browser running locally,
- a local webserver that serves your files to STAC Browser, and
- a local tile server that can serve web map tiles of images in your item assets. 

`stactools-browse` requires Docker to run.

Installation using pip: `pip install stactools stactools-browse`

Then run: `stac browse catalog.json`
