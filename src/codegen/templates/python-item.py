from pystac_client import Client

# Connect to STAC API
catalog = Client.open("__CATALOG_URL__")

# Search for items
results = catalog.search(__SEARCH_ARGS__)

# Iterate over results
for item in results.items():
    print(item.id)
