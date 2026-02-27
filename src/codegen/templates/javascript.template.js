const template = `const searchUrl = "{{SEARCH_URL}}";
const searchBody = {{FILTERS_JSON}};

const response = await fetch(searchUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(searchBody)
});

const data = await response.json();
for (const feature of data.features) {
  console.log(feature.id);
}
`;

export default template;
