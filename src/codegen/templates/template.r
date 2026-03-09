library(rstac)

catalog <- stac("{{CATALOG_URL}}")
query <- stac_search(catalog{{FILTER_ARGS}})
{{EXT_FILTER}}
result <- {{REQUEST_FUNCTION}}(query)

# Print item IDs
entries <- result[["{{RESULT_ARRAY_KEY}}"]]
if (!is.null(entries) && length(entries) > 0) {
  for (entry in entries) {
    if (!is.null(entry$id)) {
      cat(entry$id, "\\n")
    }
  }
}
