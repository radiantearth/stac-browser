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
   - `__CATALOG_URL__`: The URL of the landing page of the API
   - `__SEARCH_URL__`: The URL of the search endpoint
   - `__SEARCH_METHOD__`: The HTTP method used for the endpoint (`GET`/`POST`)
   - `__RESULT_ARRAY_KEY__`: Response array key for results (`features` for item search, `collections` for collection search)
   - `__FILTERS__`: The formatted filters, will be JSON if not implemented differently in `formatFilters()`
   - `__REQUEST_URL__`: The fully-built request URL (with query parameters for GET), constructed by `Utils.addFiltersToLink()`
   - `__REQUEST_BODY__`: The serialized JSON body (for POST), constructed by `Utils.addFiltersToLink()`
   - Language-specific variables from `getVariables()` (for example Python `__SEARCH_ARGS__`, Java `__FILTERS_STRING__`, R `__FILTERS_OBJECT__` / `__FILTER_ARGS__`)
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

Generators should emit valid code for both item and collection endpoints. Use `__RESULT_ARRAY_KEY__` in templates instead of hard-coding `features`.

CQL mode is selected from API conformance:

- If the API supports **CQL2-JSON**, generated filters use `filter-lang: cql2-json` and JSON filter bodies.
- If the API supports **CQL2-TEXT** only, generated filters use `filter-lang: cql2-text` and text expressions.

## Template Naming and Selection

Template files live in `src/codegen/templates/` and follow the naming convention `$language-$method.$extension` (e.g. `javascript-get.js`, `csharp-post.cs`). The base `CodeGenerator` calls `Utils.addFiltersToLink()` — the same method STAC Browser uses for its own requests — and exposes the result as `__REQUEST_URL__` (full URL with query parameters for GET) and `__REQUEST_BODY__` (JSON body for POST). This means GET templates don't need any query-parameter encoding logic, and a single template serves both item and collection search.

Template files are selected in generator classes (not at runtime inside generated snippets).

- Languages that use raw HTTP have two templates: `get` and `post`.
- Languages with a dedicated STAC client library (Python/pystac-client, R/rstac, Rust/stac-io) additionally have a `$language-item` template for item search. The raw HTTP templates are used for collection search.
- R also uses its `post` template for CQL2-JSON compatibility cases.

Generated snippets should be minimal and concrete.

## Generator Guidance

- Create a `get` and `post` template in `src/codegen/templates/` for your language. Use `__REQUEST_URL__` in the GET template and `__REQUEST_BODY__` (or `__FILTERS__`) in the POST template — the base class handles query-parameter encoding and body construction via `Utils.addFiltersToLink()`.
- If a STAC client library exists for your language, add a separate `$language-item` template that uses the library for item search.
- The template file defines placeholders that the generator replaces with the query parameters selected in the UI, so the generated snippet reflects the user's current query.
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
