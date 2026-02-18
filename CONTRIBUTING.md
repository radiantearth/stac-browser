# Contributing

We are happy to review and accept Pull Requests.
STAC Browser is following the [STAC code of conduct](https://github.com/radiantearth/stac-spec/blob/master/CODE_OF_CONDUCT.md).

## Development

STAC Browser builds on top of [VueJS 3](https://vuejs.org/) and [Vite](https://vite.dev),
so you need a recent version of [NodeJS and npm](https://nodejs.org/en/) installed.

You can run the following commands (see also "[Get started](README.md#get-started)" in the README):

- `npm run install`: Install the dependencies, this is required once at the beginning.
- `npm start`: Start the development server
- `npm run lint`: Lint the source code files
- `npm run build`: Compile the source code into deployable files for the web. The resulting files can be found in the folder `dist` and you can then deploy STAC Browser on a web host. There are two other variants:
  - `npm run build:report`: Same as above, but also generates a bundle size report (see `dist/report.html`), which should not be deployed.
  - `npm run build:minimal`: Same as above, but tries to generate a minimal version without bundle size report and without source maps.
- `npm run i18n:fields`: Generates an updated version of the locales from the stac-fields package.

The [release process is documented separately](docs/release.md).

## Adding a new language

You can translate STAC Browser into other languages.
You can also use one of the existing languages and provide an alternate version for a specifc country, e.g. a Australian English (en-AU) version of the US-English language pack (en).

**Please follow this guide:**

- Copy the `en` folder (or any other language without a country code that you want to base the translation on).
  - Note: If you start with the `en` folder, you have to remove the leading `//` from the line `// { fields: require('./fields.json') }` in the file `default.js`.
- Name the new folder according to [RFC5646](https://www.rfc-editor.org/rfc/rfc5646).
- Add the language to the list of supported locales ([`supportedLocales`](docs/options.md#supportedlocales)) in the `config.js` file.
- Add the language to the [list of languages in this README file](README.md#languages).
- Add yourself to the list of code owners (`.github/CODEOWNERS`) for this language (we'll invite you to this repository after you've opened a PR). **Persons contributing languages are expected to maintain them long-term! If you are not able to maintain the language pack, please indicate so in the PR and we'll release it separately.**
- Translate the `.json` files, most importantly `config.json`, `fields.json` and `texts.json`.
  - Please note that you never need to translate any object keys!
  - If you base your language on another existing language (e.g. create `en-IN` based on `en`) you can delete individual files and import existing files from other languages in `default.js`.
- Adapt the `datepicker.js`, `duration.js` and `validation.js` files to import the existing definitions from their corresponding external packages, but you could also define the specifics yourself.
- Check that your translation works by running the development server (`npm start`) and navigating to the STAC Browser instance in your browser (usually `http://localhost:8080`).
- Once completed, please open a pull request and we'll get back to you as soon as possible.
- After merging the PR for the first time, we'll add you to our translation management tool Crowdin: <https://crowdin.com/project/stac-browser/>. Please get in touch to get your invite!

## AI Use Policy

AI tools are part of modern development workflows and contributors may use them. However, all contributions must meet STAC Browser quality standards regardless of how they were created.

### Guidelines

AI-assisted development is acceptable when used responsibly. Contributors must:

- **Test all code thoroughly.** Submit only code you have verified works correctly.
- **Understand your contributions.** You need to be able to explain the code changes you submit.
- **Write clear, concise PR descriptions** in your own words.
- **Use your own voice** in GitHub issues and PR discussions.
- **Take responsibility** for code quality, correctness, and maintainability.

### Disclosure

Disclose AI assistance when substantial algorithms or logic were AI-generated, or when uncertain about licensing or copyright implications. Be honest if a reviewer asks about code origins.

### Unacceptable Submissions

Pull requests may be closed without review if they contain:

- Untested code
- Verbose AI-generated descriptions
- Evidence the contributor doesn't understand the submission

Using AI to assist learning and development is encouraged. Using it to bypass understanding or submit work you cannot explain is not.

*This policy is adapted from the [GRASS GIS contribution guidelines](https://github.com/OSGeo/grass/blob/main/CONTRIBUTING.md).*
