# Code Generators

Code Examples are created to display example queries for multiple langguages. The language list is in [codeGenerators.config.js](../codeGenerators.config.js). If you add or remove a language, update that file.

## Add a New Language

1. Create a generator class in `src/codegen/`, for example `LanguageGenerator.js`.
2. Make it extend `CodeGenerator` and implement:
   - `static get label()`
   - `static get language()`
   - `static get outputFile()`
   - `generate()`
3. Add the new generator import and class to the array in [codeGenerators.config.js](../codeGenerators.config.js).
4. Add a template in `src/codegen/templates/` for the generator.
5. Validate with integration tests:
   - `npm run test:integration`
6. Add an integration runtime test in `tests/integration/` (for example Dockerfile and `docker-compose.yml`).

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
