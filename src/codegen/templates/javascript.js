const url = "__REQUEST_URL__";
/// if IS_POST ///
const response = await fetch(url, {
  method: "__SEARCH_METHOD__",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(__REQUEST_BODY__)
});
/// else ///
const response = await fetch(url);
/// endif ///
const data = await response.json();
for (const entry of data.__RESULT_ARRAY_KEY__ ?? []) {
  console.log(entry.id);
}
