# Code Generators

Code Examples are created to display example queries for multiple languages. The language list is in [codeGenerators.config.js](../codeGenerators.config.js). If you add or remove a language, update that file.

## Add a New Language

1. Create a generator class in `src/codegen/`, for example `LanguageGenerator.js`.
2. Make it extend `CodeGenerator` and implement:
   - `get language()`
   - `get outputFile()`
   - `get template()`
   - if the language doesn't use `#`-style comments: `get commentChars()`
   - if dependencies are needed for running the code: `get installDependencies()`
   - if JSON should be indented: `get indent()`
   - if you need extra template variables: `getVariables(filters, cqlSerialized)`
   - if you have separate templates for native/HTTP: `getTemplate(filters, cqlSerialized)`
3. Add the language to the `programming` group of the locals, using the value of `get language()` as the key.
4. Add the new generator import and class to the array in [codeGenerators.config.js](../codeGenerators.config.js).
5. Add template file(s) in `src/codegen/templates/` — one per language, or a native + HTTP pair if the STAC client library doesn't cover all scenarios.
6. Validate with integration tests:
   - `npm run test:integration`
7. Add an integration runtime test in `tests/integration/` (for example Dockerfile and `docker-compose.yml`).

Integration tests for code generators are run with Docker so each language snippet executes in an isolated, reproducible runtime. The test script first generates fresh snippets into `tests/integration/generated/`, then builds the images/services defined in `tests/integration/docker-compose.yml`, and finally runs each language service against a real STAC API endpoint. This verifies both that snippet generation succeeds and that the generated code actually runs in its target language environment.

If a generator implements `get installDependencies()`, the same command is shown in the Example Code UI and also executed by the integration test harness before running the snippet. This keeps user-facing install instructions and CI/runtime setup in sync.

## Template Syntax

Templates use `__KEY__` placeholders (double-underscore delimited) that are replaced at generation time. The following built-in variables are available in every template:

| Variable             | Description |
|----------------------|-------------|
| `__CATALOG_URL__`    | The URL of the landing page of the API |
| `__SEARCH_URL__`     | The URL of the search endpoint |
| `__SEARCH_METHOD__`  | The HTTP method used for the endpoint (`GET`/`POST`) |
| `__RESULT_ARRAY_KEY__`| Response array key for results (`features` for item search, `collections` for collection search) |
| `__FILTERS__`        | The formatted filters as JSON (without CQL wrapper objects) |
| `__REQUEST_URL__`    | The fully-built request URL (with query parameters for GET), constructed by `Utils.addFiltersToLink()` |
| `__REQUEST_BODY__`   | The serialized JSON body (for POST), constructed by `Utils.addFiltersToLink()` |
| `__IS_GET__`         | Boolean — true when search method is GET |
| `__IS_POST__`        | Boolean — true when search method is POST |

Generators can add language-specific variables by overriding `getVariables(filters, cqlSerialized)`.

### Conditionals

Templates support conditional blocks using comment syntax, so templates remain valid in their language. The comment characters are configured via the `commentChars` getter (default `##` for `#`-comment languages, `///` for `//`-comment languages):

```python
## if IS_POST ##
# POST-specific code
## else ##
# GET-specific code
## endif ##
```

```javascript
/// if IS_POST ///
// POST-specific code
/// else ///
// GET-specific code
/// endif ///
```

A block with no `else` is omitted entirely when the variable is falsy. The `if`, `else`, and `endif` tags should each be on their own line — the tag line itself is consumed and does not produce blank lines in the output.

## Search Scenarios and CQL Mode

Code examples are generated for three practical UI scenarios:

1. **Global item search** (API Item Search)
2. **Collection search** (API Collection Search)
3. **Item search scoped by selected collections**

Generators should emit valid code for both item and collection endpoints. Use `__RESULT_ARRAY_KEY__` in templates instead of hard-coding `features`.

CQL mode is determined automatically from API conformance via the `Cql` class's `serialize()` method:

- If the API supports **CQL2-JSON**, generated filters use `filter-lang: cql2-json` and JSON filter bodies.
- If the API supports **CQL2-TEXT** only, generated filters use `filter-lang: cql2-text` and text expressions.
- For **GET** requests, text format is preferred when available; JSON is used as fallback.
- For **POST** requests, JSON format is preferred when available; text is used as fallback.

Request preparation (query parameter encoding for GET, body construction for POST, CQL serialization) is handled by `Utils.addFiltersToLink()` — the same method STAC Browser uses for its own requests.

## Template Organization

Most languages have **one template file** in `src/codegen/templates/`, using comment-based conditionals to handle GET/POST differences. This replaces the earlier convention of separate `get`/`post`/`item` templates per language.

- Languages that use raw HTTP (JavaScript, C#, Java) use `if IS_POST` conditionals to switch between POST and GET code paths.
- Languages with a dedicated STAC client library (R/rstac, Rust/stac-rs) use **separate template files** for the native client path and the raw HTTP fallback (e.g. `r.r` + `r-http.r`, `rust.rs` + `rust-http.rs`). The generator selects the appropriate template at generation time based on search context (collection search, CQL filters, etc.).
- Python uses pystac-client in a single template since the library covers all search scenarios.

### Template Selection

When a language needs context-dependent template selection, the generator can:

1. Override `get template()` if the decision depends only on properties available on the generator instance (e.g. `this.isCollectionSearch`). See `RGenerator` for an example.
2. Override `getTemplate(filters, cqlSerialized)` if the decision also depends on the filter/CQL context passed during generation. See `RustGenerator` for an example.

The base `getTemplate()` method returns `this.template` by default.

Generated snippets should be minimal and concrete.

## Generator Guidance

- Create a template in `src/codegen/templates/` for your language. Use comment-based conditionals (`CC if IS_POST CC` where `CC` is your `commentChars`) to differentiate GET and POST code paths.
- Override `get commentChars()` to return the appropriate comment prefix for your language (`'##'` for `#`-based comments, `'///'` for `//`-based comments).
- Use `__REQUEST_URL__` in the GET branch and `__REQUEST_BODY__` in the POST branch — the base class handles query-parameter encoding and body construction via `Utils.addFiltersToLink()`.
- If a STAC client library exists for your language but doesn't cover all scenarios (e.g. collection search, CQL), create **separate template files** — one for the native client and one for raw HTTP — and override `get template()` or `getTemplate(filters, cqlSerialized)` to select the right one.
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
