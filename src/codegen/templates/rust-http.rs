use reqwest::Client;
/// if IS_POST ///
use serde_json::{json, Value};
/// else ///
use serde_json::Value;
/// endif ///
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
/// if IS_POST ///
    let search_url = "__SEARCH_URL__";
    let filters = json!(__REQUEST_BODY__);
    let body = serde_json::to_vec(&filters)?;
    let response = client
        .request(reqwest::Method::from_bytes("__SEARCH_METHOD__".as_bytes())?, search_url)
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await?;
/// else ///
    let response = client.get("__REQUEST_URL__").send().await?;
/// endif ///
    let payload: Value = serde_json::from_str(&response.text().await?)?;
    if let Some(entries) = payload.get("__RESULT_ARRAY_KEY__").and_then(|value| value.as_array()) {
        for entry in entries {
            if let Some(id) = entry.get("id").and_then(|value| value.as_str()) {
                println!("{}", id);
            }
        }
    }

    Ok(())
}
