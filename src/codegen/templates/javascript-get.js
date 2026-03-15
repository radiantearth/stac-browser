const url = "__REQUEST_URL__";
const response = await fetch(url);
const data = await response.json();
for (const entry of data.__RESULT_ARRAY_KEY__ ?? []) {
  console.log(entry.id);
}
