#!/usr/bin/env sh
## if IS_POST ##
curl -sS -X __SEARCH_METHOD__ "__REQUEST_URL__" \
  -H "Content-Type: application/json" \
  --data-binary @- <<'JSON'
__REQUEST_BODY__
JSON
## else ##
curl -sS -H "Accept: application/json" "__REQUEST_URL__"
## endif ##
