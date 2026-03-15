use reqwest::Client;
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client.get("__REQUEST_URL__").send().await?;
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
