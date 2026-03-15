import json
from urllib.request import Request, urlopen

request = Request("__REQUEST_URL__")
with urlopen(request) as response:
    result = json.load(response)

for entry in result.get("__RESULT_ARRAY_KEY__", []):
    entry_id = entry.get("id")
    if entry_id:
        print(entry_id)
