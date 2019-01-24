#!/usr/bin/env node

const path = require("path");
const url = require("url");

const commandLineArgs = require("command-line-args");
const fs = require("fs-extra");
const Prerenderer = require("@prerenderer/prerenderer");
const Renderer = require("@prerenderer/renderer-puppeteer");

const { crawl, slugify: _slugify } = require("../lib/");

class STACRenderer extends Renderer {
  async init(start, Prerenderer) {
    const rootOptions = Prerenderer.getOptions();
    const options = this._rendererOptions;
    const baseURL = `http://localhost:${rootOptions.server.port}`;

    this.page = await this._puppeteer.newPage();

    await this.page.setRequestInterception(true);

    this.page.on("request", req => {
      // Skip third party requests if needed.
      if (
        this._rendererOptions.skipThirdPartyRequests &&
        !req.url().startsWith(baseURL) &&
        this._rendererOptions.skipThirdPartyRequests(req)
      ) {
        return req.abort();
      }

      req.continue();
    });

    const navigationOptions = options.navigationOptions
      ? { waituntil: "networkidle0", ...options.navigationOptions }
      : { waituntil: "networkidle0" };

    await this.page.goto(`${baseURL}${start}`, navigationOptions);

    // Wait for some specific element exists
    const { renderAfterElementExists } = this._rendererOptions;
    if (
      renderAfterElementExists &&
      typeof renderAfterElementExists === "string"
    ) {
      await this.page.waitForSelector(renderAfterElementExists);
    }
  }

  async render(route) {
    const options = this._rendererOptions;

    const page = this.page;

    if (options.consoleHandler) {
      page.on("console", message => options.consoleHandler(route, message));
    }

    await page.evaluate(
      route =>
        new Promise(resolve => window.router.replace(route, resolve, resolve)),
      route
    );

    const result = {
      originalRoute: route,
      route: await page.evaluate("window.location.pathname"),
      html: await page.content()
    };

    page.removeAllListeners("console");

    return result;
  }
}

const options = commandLineArgs(
  [
    { name: "verbose", alias: "v", type: Boolean },
    { name: "help", alias: "h", type: Boolean },
    { name: "public-url", alias: "p", type: String },
    { name: "root", type: String, defaultOption: true }
  ],
  {
    camelCase: true
  }
);

if (options.help || options.root == null) {
  console.warn("Usage: prerender [-v] [-h] [-p public URL] <root catalog URL>");
  process.exit(1);
}

const slugify = _slugify.bind(null, options.root);

async function prerender(routes) {
  let prerenderer;
  let sitemap;

  if (options.publicUrl) {
    sitemap = fs.createWriteStream(
      path.join(__dirname, "..", "dist", "sitemap.txt")
    );
  }

  const uri = url.parse(options.root);

  try {
    const renderer = new STACRenderer({
      renderAfterElementExists: ".container",
      // allow catalog requests
      skipThirdPartyRequests: req => !req.url().includes(uri.hostname)
    });

    prerenderer = new Prerenderer({
      staticDir: path.join(__dirname, "..", "dist"),
      renderer
    });

    await prerenderer.initialize();
    await renderer.init("/", prerenderer);

    for (const route of routes) {
      const { html } = await renderer.render(route);

      try {
        const outputDir = path.join(__dirname, "..", "dist", route.slice(1));
        const outputFile = `${outputDir}/index.html`;

        await fs.ensureDir(outputDir);
        await fs.writeFile(outputFile, html.trim());
      } catch (err) {
        console.warn(err.stack);
      }

      if (sitemap != null) {
        sitemap.write(`${options.publicUrl}${route}\n`);
      }
    }
  } finally {
    if (prerenderer != null) {
      prerenderer.destroy();
    }

    if (sitemap != null) {
      sitemap.end();

      await fs.writeFile(
        path.join(__dirname, "..", "dist", "robots.txt"),
        `sitemap: ${options.publicUrl}/sitemap.txt\n`
      );
    }
  }
}

async function main() {
  const routes = [];

  // eslint-disable-next-line no-unused-vars
  for await (const [url, type, ancestors] of crawl(options.root)) {
    let route =
      "/" +
      // assemble the path to this entity
      ancestors
        .concat(url)
        // drop the root
        .slice(1)
        .map(slugify)
        .join("/");

    if (type === "item") {
      route = "/item" + route;
    }

    if (type === "collection") {
      route =
        "/collection" +
        "/" +
        // assemble the path to this entity
        ancestors
          .concat(url)
          .map(slugify)
          .join("/");
    }

    routes.push(route);
  }

  await prerender(routes);
}

main()
  .then(process.exit)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
