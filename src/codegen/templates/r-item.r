library(rstac)

catalog <- stac("__CATALOG_URL__")
query <- stac_search(catalog__FILTER_ARGS__)
__EXT_FILTER__
result <- __REQUEST_FUNCTION__(query)

# Print item IDs
entries <- result[["__RESULT_ARRAY_KEY__"]]
if (!is.null(entries) && length(entries) > 0) {
  for (entry in entries) {
    if (!is.null(entry$id)) {
      cat(entry$id, "\\n")
    }
  }
}
