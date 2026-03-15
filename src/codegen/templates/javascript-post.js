const url = "__SEARCH_URL__";
const response = await fetch(url, {
  method: "__SEARCH_METHOD__",
  headers: { "Content-Type": "application/json" },
  body: __REQUEST_BODY__
});
const data = await response.json();
for (const entry of data.__RESULT_ARRAY_KEY__ ?? []) {
  console.log(entry.id);
}
