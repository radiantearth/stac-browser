# Code Generators

Code Examples are created to display example queries for multiple languages. The language list is in [codeGenerators.config.js](../codeGenerators.config.js). If you add or remove a language, update that file.

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
   - `{{SEARCH_METHOD}}`: The HTTP method used for the endpoint (`GET`/`POST`)
   - `{{RESULT_ARRAY_KEY}}`: Response array key for results (`features` for item search, `collections` for collection search)
   - `{{FILTERS}}`: The formatted filters, will be JSON if not implemented differently in `formatFilters()`
   - Language-specific variables from `getVariables()` (for example Python `{{SEARCH_ARGS}}`, Java `{{QUERY_STRING}}` / `{{FILTERS_STRING}}`, R `{{FILTERS_OBJECT}}` / `{{FILTER_ARGS}}`)
5. Add a template in `src/codegen/templates/` for the generator.
6. Validate with integration tests:
   - `npm run test:integration`
7. Add an integration runtime test in `tests/integration/` (for example Dockerfile and `docker-compose.yml`).

Integration tests for code generators are run with Docker so each language snippet executes in an isolated, reproducible runtime. The test script first generates fresh snippets into `tests/integration/generated/`, then builds the images/services defined in `tests/integration/docker-compose.yml`, and finally runs each language service against a real STAC API endpoint. This verifies both that snippet generation succeeds and that the generated code actually runs in its target language environment.

If a generator implements `get installDependencies()`, the same command is shown in the Example Code UI and also executed by the integration test harness before running the snippet. This keeps user-facing install instructions and CI/runtime setup in sync.

## Search Scenarios and CQL Mode

Code examples are generated for three practical UI scenarios:

1. **Global item search** (API Item Search)
2. **Collection search** (API Collection Search)
3. **Item search scoped by selected collections**

Generators should emit valid code for both item and collection endpoints. Use `{{RESULT_ARRAY_KEY}}` in templates instead of hard-coding `features`.

CQL mode is selected from API conformance:

- If the API supports **CQL2-JSON**, generated filters use `filter-lang: cql2-json` and JSON filter bodies.
- If the API supports **CQL2-TEXT** only, generated filters use `filter-lang: cql2-text` and text expressions.

## Template Naming and Selection

Template files live in `src/codegen/templates/` and follow the naming convention `$language-$type-$method.$extension` (e.g. `rust-item-get.rs`, `python-collection-post.py`). The `$method` part is omitted when the language uses a single template for both methods.

Template files are selected in generator classes (not at runtime inside generated snippets).

- Languages that use raw HTTP typically have four templates: `item-get`, `item-post`, `collection-get`, `collection-post`.
- Python item search uses a single `python-item.py` template (pystac-client) with computed `{{SEARCH_ARGS}}`.
- R item search uses `r-item.r`, with `r-collection-post.r` also used for CQL2-JSON compatibility cases.

Generated snippets should be minimal and concrete.

## Generator Guidance

- Create dedicated template files in `src/codegen/templates/` for each transport/search variant your language needs.
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
