const template = `use stac::api::Search;
use serde_json::json;
use stac_io::api;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let params = json!({{FILTERS_JSON}});
    let search: Search = serde_json::from_value(params)?;
    let max_items = search.limit.and_then(|value| usize::try_from(value).ok());
    let items = api::search("{{CATALOG_URL}}", search, max_items).await?;

    for item in items.items {
        if let Some(id) = item.get("id").and_then(|value| value.as_str()) {
            println!("{}", id);
        }
    }

    Ok(())
}
`;

export default template;
