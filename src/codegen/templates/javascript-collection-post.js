const searchFilters = JSON.parse(`{{FILTERS}}`);

const response = await fetch("{{SEARCH_URL}}", {
  method: "{{SEARCH_METHOD}}",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(searchFilters)
});

const data = await response.json();
const entries = Array.isArray(data.collections) ? data.collections : [];
for (const entry of entries) {
  console.log(entry.id);
}
