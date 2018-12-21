#!/usr/bin/env node

const path = require("path");

const commandLineArgs = require("command-line-args");
const fs = require("fs-extra");
const pMap = require("p-map");
const Prerenderer = require("@prerenderer/prerenderer");
const Renderer = require("@prerenderer/renderer-puppeteer");

const { crawl, slugify: _slugify } = require("../lib/");

const options = commandLineArgs([
  { name: "verbose", alias: "v", type: Boolean },
  { name: "help", alias: "h", type: Boolean },
  { name: "root", type: String, defaultOption: true }
]);

if (options.help || options.root == null) {
  console.warn("Usage: prerender [-v] [-h] <root catalog URL>");
  process.exit(1);
}

const slugify = _slugify.bind(null, options.root);

async function main() {
  const routes = [];

  // eslint-disable-next-line no-unused-vars
  for await (const [type, url, entity, ancestors] of crawl(options.root)) {
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
      route = "/collection" + route;
    }

    routes.push(route);
  }

  let prerenderer;

  try {
    prerenderer = new Prerenderer({
      staticDir: path.join(__dirname, "..", "dist"),
      renderer: new Renderer({
        maxConcurrentRoutes: 10,
        renderAfterElementExists: ".container"
      })
    });

    await prerenderer.initialize();

    const renderedRoutes = await prerenderer.renderRoutes(routes);

    await pMap(
      renderedRoutes,
      async ({ route, html }) => {
        try {
          const outputDir = path.join(__dirname, "..", "dist", route.slice(1));
          const outputFile = `${outputDir}/index.html`;

          await fs.ensureDir(outputDir);
          await fs.writeFile(outputFile, html.trim());
        } catch (err) {
          console.warn(err.stack);
        }
      },
      {
        concurrency: 100
      }
    );
  } finally {
    if (prerenderer != null) {
      prerenderer.destroy();
    }
  }
}

main()
  .then(process.exit)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
