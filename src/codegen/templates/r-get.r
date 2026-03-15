library(httr)
library(jsonlite)

resp <- GET("__REQUEST_URL__")
result <- fromJSON(content(resp, as = "text", encoding = "UTF-8"), simplifyVector = FALSE)

entries <- result[["__RESULT_ARRAY_KEY__"]]
if (!is.null(entries) && length(entries) > 0) {
  for (entry in entries) {
    if (!is.null(entry$id)) {
      cat(entry$id, "\n")
    }
  }
}
