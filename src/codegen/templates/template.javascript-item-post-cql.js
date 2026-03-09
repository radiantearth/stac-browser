const searchFilters = JSON.parse(`{{FILTERS}}`);

const response = await fetch("{{SEARCH_URL}}", {
  method: "{{SEARCH_METHOD}}",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(searchFilters)
});

const data = await response.json();
const entriesKey = '{{RESULT_ARRAY_KEY}}';
const entries = Array.isArray(data[entriesKey]) ? data[entriesKey] : [];
for (const entry of entries) {
  console.log(entry.id);
}
