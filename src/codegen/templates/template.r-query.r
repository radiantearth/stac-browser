library(httr)
library(jsonlite)

search_filters <- {{FILTERS_OBJECT}}

for (name in names(search_filters)) {
  value <- search_filters[[name]]
  if (is.list(value)) {
    search_filters[[name]] <- jsonlite::toJSON(value, auto_unbox = TRUE)
  } else if (length(value) > 1) {
    search_filters[[name]] <- paste(value, collapse = ",")
  }
}

resp <- GET("{{SEARCH_URL}}", query = search_filters)
result <- fromJSON(content(resp, as = "text", encoding = "UTF-8"), simplifyVector = FALSE)

entries <- result[["collections"]]
if (!is.null(entries) && length(entries) > 0) {
  for (entry in entries) {
    if (!is.null(entry$id)) {
      cat(entry$id, "\\n")
    }
  }
}
