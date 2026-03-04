const searchBody = {{FILTERS}};

const response = await fetch("{{SEARCH_URL}}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(searchBody)
});

const data = await response.json();
for (const feature of data.features) {
  console.log(feature.id);
}
