library(rstac)

# Build and execute search
catalog <- stac("{{CATALOG_URL}}")
query <- stac_search(catalog{{FILTERS}})
result <- post_request(query)

# Print item IDs
if (!is.null(result$features) && length(result$features) > 0) {
  for (feature in result$features) {
    if (!is.null(feature$id)) {
      cat(feature$id, "\\n")
    }
  }
}
