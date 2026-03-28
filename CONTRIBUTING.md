# Contributing <!-- omit in toc -->

- [Development](#development)
- [Tests](#tests)
- [Running Tests](#running-tests)
- [AI Use Policy](#ai-use-policy)
  - [Guidelines](#guidelines)
  - [Disclosure](#disclosure)
  - [Unacceptable Submissions](#unacceptable-submissions)

We are happy to review and accept Pull Requests.
STAC Browser is following the [STAC code of conduct](https://github.com/radiantearth/stac-spec/blob/master/CODE_OF_CONDUCT.md).

## Development

STAC Browser builds on top of [VueJS 3](https://vuejs.org/) and [Vite](https://vite.dev),
so you need a recent version of [NodeJS and npm](https://nodejs.org/en/) installed.

You can run the following commands (see also "[Get started](README.md#get-started)" in the README):

- Getting Started
  - `npm run install`: Install the dependencies, this is required once at the beginning.
  - `npm start`: Start the development server
- Linting
  - `npm run lint`: Lint the source code files
  - `npm run docs:lint`: Lint the documentation files
- Build step
  - `npm run build`: Compile the source code into deployable files for the web. The resulting files can be found in the folder `dist` and you can then deploy STAC Browser on a web host. There are two other variants:
  - `npm run build:report`: Same as above, but also generates a bundle size report (see `dist/report.html`), which should not be deployed.
  - `npm run build:minimal`: Same as above, but tries to generate a minimal version without bundle size report and without source maps.
- Update files
  - `npm run i18n:fields`: Generates an updated version of the locales from the stac-fields package.
  - `npm run docs:hooks`: Update the list of hooks in the documentation
- Tests: For [test commands](#tests), please see below.

The [release process is documented separately](docs/release.md).

## Tests

End-to-end tests for STAC Browser using [Playwright](https://playwright.dev). All tests run against mock data — no real network calls.

For work on testing fixtures, test fixture documentation can be found [here](tests/TESTING_DOCS.md).

Tests are located in the `tests/e2e` directory and follow the naming convention `*.spec.js`.

## Running Tests

- `npm test`: Run all tests
- `npm run test:e2e:ui`: Run UI tests in UI mode (interactive)
- `npm run test:e2e:headed`: Run UI tests in headed mode (see browser)
- `npm run test:e2e:debug`: Debug UI tests
- `npm run test:e2e:report`: View UI test report

**Additional resources:**

- [Test Fixture Documentation](tests/TESTING_DOCS.md)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)


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
