const template = `from pystac_client import Client

# Connect to STAC API
catalog = Client.open("{{CATALOG_URL}}")

# Search for items
results = catalog.search({{SEARCH_ARGS}})

# Iterate over results
for item in results.items():
    print(item.id)
`;

export default template;
