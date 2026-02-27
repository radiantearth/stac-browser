const template = `use reqwest;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let params = json!({{FILTERS_JSON}});

    let response = client.post("{{SEARCH_URL}}")
        .json(&params)
        .send()
        .await?;

    let body: serde_json::Value = response.json().await?;
    if let Some(features) = body["features"].as_array() {
        for feature in features {
            if let Some(id) = feature["id"].as_str() {
                println!("{}", id);
            }
        }
    }

    Ok(())
}
`;

export default template;
