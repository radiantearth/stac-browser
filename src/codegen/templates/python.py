from pystac_client import Client

catalog = Client.open("__CATALOG_URL__")
results = catalog.__SEARCH_FUNCTION__(__SEARCH_ARGS__)

for entry in results.__RESULT_ARRAY_KEY__():
    print(entry.id)
