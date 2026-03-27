library(httr)
library(jsonlite)

## if IS_POST ##
search_filters <- __FILTERS_OBJECT__
resp <- VERB("__SEARCH_METHOD__", "__SEARCH_URL__", body = search_filters, encode = "json")
## else ##
resp <- GET("__REQUEST_URL__")
## endif ##
result <- fromJSON(content(resp, as = "text", encoding = "UTF-8"), simplifyVector = FALSE)

entries <- result[["__RESULT_ARRAY_KEY__"]]
if (!is.null(entries) && length(entries) > 0) {
  for (entry in entries) {
    if (!is.null(entry$id)) {
      cat(entry$id, "\n")
    }
  }
}
