library(httr)
library(jsonlite)

# Build search body
body <- list({{BODY_PROPS}})

# Execute search
search_url <- "{{SEARCH_URL}}"
response <- POST(search_url, body = body, encode = "json",
                  content_type_json())
result <- content(response, as = "parsed", type = "application/json")

# Print item IDs
for (feature in result$features) {
  cat(feature$id, "\n")
}
