use reqwest::Client;
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let search_url = "{{SEARCH_URL}}";
    let filters = json!({{FILTERS}});
    let mut url = reqwest::Url::parse(search_url)?;
    use stac::api::Search;
    use serde_json::json;
    use stac_io::api;
        for (key, value) in object {
            if value.is_null() {
                continue;
        let params = json!({{FILTERS}});
        let search: Search = serde_json::from_value(params)?;
        let max_items = search.limit.and_then(|value| usize::try_from(value).ok());
        let items = api::search("{{CATALOG_URL}}", search, max_items).await?;

        for item in items.items {
            if let Some(id) = item.get("id").and_then(|value| value.as_str()) {
                println!("{}", id);
    if let Some(number) = value.as_i64() {
        return number.to_string();
    }
    if let Some(number) = value.as_u64() {
        return number.to_string();
    {
