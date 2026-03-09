use reqwest::Client;
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let search_url = "{{SEARCH_URL}}";
    let filters = json!({{FILTERS}});

    let body = serde_json::to_vec(&filters)?;
    let response = client
        .request(reqwest::Method::from_bytes("{{SEARCH_METHOD}}".as_bytes())?, search_url)
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await?;

    let payload: Value = serde_json::from_str(&response.text().await?)?;
    if let Some(entries) = payload.get("{{RESULT_ARRAY_KEY}}").and_then(|value| value.as_array()) {
        for entry in entries {
            if let Some(id) = entry.get("id").and_then(|value| value.as_str()) {
                println!("{}", id);
            }
        }
    }

    Ok(())
}
