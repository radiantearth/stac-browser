# Code Generators

Code Examples are created to display example queries for multiple langguages. The language list is in [codeGenerators.config.js](../codeGenerators.config.js). If you add or remove a language, update that file.

## Add a New Language

1. Create a generator class in `src/codegen/`, for example `LanguageGenerator.js`.
2. Make it extend `CodeGenerator` and implement:
   - `get language()`
   - `get outputFile()`
   - `get template()`
   - if dependencies are needed for running the code: `get installDependencies()`
   - if JSON should be indented: `get indent()`
   - if you need a custom format for the filters: `formatFilters()`
3. Add the language to the `programming` group of the locals, using the value of `get language()` as the key.
4. Add the new generator import and class to the array in [codeGenerators.config.js](../codeGenerators.config.js). You can use the following variables:
   - `{{CATALOG_URL}}`: The URL of the landing page of the API
   - `{{SEARCH_URL}}`: The URL of the search endpoint
   - `{{FILTERS}}`: The formatted filters, will be JSON if not implemented differently in `formatFilters()`
5. Add a template in `src/codegen/templates/` for the generator.
6. Validate with integration tests:
   - `npm run test:integration`
7. Add an integration runtime test in `tests/integration/` (for example Dockerfile and `docker-compose.yml`).

Integration tests for code generators are run with Docker so each language snippet executes in an isolated, reproducible runtime. The test script first generates fresh snippets into `tests/integration/generated/`, then builds the images/services defined in `tests/integration/docker-compose.yml`, and finally runs each language service against a real STAC API endpoint. This verifies both that snippet generation succeeds and that the generated code actually runs in its target language environment.

## Generator Guidance

- Create a dedicated template file in `src/codegen/templates/` for each new language.
- The template file defines placeholders  that the generator replaces with the query parameters selected in the UI, so the generated snippet reflects the user's current query.
- Prefer an established STAC client library for that language when one is available or generic HTTP requests when no practical STAC client library exists.

## Remove a Language

1. Remove the generator from [codeGenerators.config.js](../codeGenerators.config.js).
2. Remove any language-specific integration files under `tests/integration/`.
3. Validate with integration tests:
   - `npm run test:integration`

## Notes

- The order in [codeGenerators.config.js](../codeGenerators.config.js) controls tab order in the UI.
- Snippets shown in the app are generated at runtime from the active generator.
- [tests/integration/generate-snippets.js](../tests/integration/generate-snippets.js) is a test helper used by `npm run test:integration` and does not need per-language edits.
