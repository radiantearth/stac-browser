import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

search_url = "{{SEARCH_URL}}"
search_filters = {{FILTERS}}

params = {}
for key, value in search_filters.items():
    if value is None or value == "":
        continue
    if isinstance(value, list):
        params[key] = ",".join(str(item) for item in value)
    elif isinstance(value, dict):
        params[key] = json.dumps(value)
    else:
        params[key] = str(value)

request_url = f"{search_url}?{urlencode(params)}" if params else search_url
request = Request(request_url)
with urlopen(request) as response:
    result = json.load(response)

for entry in result.get("{{RESULT_ARRAY_KEY}}", []):
    entry_id = entry.get("id")
    if entry_id:
        print(entry_id)
