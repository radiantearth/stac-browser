import json
from urllib.request import Request, urlopen

search_url = "{{SEARCH_URL}}"
search_filters = {{FILTERS}}

payload = json.dumps(search_filters).encode("utf-8")
request = Request(
    search_url,
    data=payload,
    method="{{SEARCH_METHOD}}",
    headers={"Content-Type": "application/json"}
)
with urlopen(request) as response:
    result = json.load(response)

for entry in result.get("{{RESULT_ARRAY_KEY}}", []):
    entry_id = entry.get("id")
    if entry_id:
        print(entry_id)
