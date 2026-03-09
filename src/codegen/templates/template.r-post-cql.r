library(httr)
library(jsonlite)

search_filters <- {{FILTERS_OBJECT}}
resp <- VERB("{{SEARCH_METHOD}}", "{{SEARCH_URL}}", body = search_filters, encode = "json")
result <- fromJSON(content(resp, as = "text", encoding = "UTF-8"), simplifyVector = FALSE)

entries <- result[["{{RESULT_ARRAY_KEY}}"]]
if (!is.null(entries) && length(entries) > 0) {
  for (entry in entries) {
    if (!is.null(entry$id)) {
      cat(entry$id, "\\n")
    }
  }
}
