from pystac_client import Client

url = "__CATALOG_URL__"
catalog = Client.open(url)
results = catalog.__SEARCH_FUNCTION__(__SEARCH_ARGS__)

for entry in results.__ITERATOR_NAME__():
    print(entry.id)
