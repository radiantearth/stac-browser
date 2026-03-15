const searchFilters = JSON.parse(`{{FILTERS}}`);
const searchUrl = new URL("{{SEARCH_URL}}");

for (const [key, value] of Object.entries(searchFilters)) {
  if (value !== null && value !== undefined && value !== "") {
    const queryValue = (value && typeof value === "object") ? JSON.stringify(value) : String(value);
    searchUrl.searchParams.set(key, queryValue);
  }
}

const response = await fetch(searchUrl.toString());
const data = await response.json();
const entriesKey = '{{RESULT_ARRAY_KEY}}';
const entries = Array.isArray(data[entriesKey]) ? data[entriesKey] : [];
for (const entry of entries) {
  console.log(entry.id);
}
