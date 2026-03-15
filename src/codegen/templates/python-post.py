import json
from urllib.request import Request, urlopen

search_filters = __FILTERS__

payload = json.dumps(search_filters).encode("utf-8")
request = Request(
    "__SEARCH_URL__",
    data=payload,
    method="__SEARCH_METHOD__",
    headers={"Content-Type": "application/json"}
)
with urlopen(request) as response:
    result = json.load(response)

for entry in result.get("__RESULT_ARRAY_KEY__", []):
    entry_id = entry.get("id")
    if entry_id:
        print(entry_id)
