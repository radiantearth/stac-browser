use reqwest::Client;
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let search_url = "{{SEARCH_URL}}";
    let filters = json!({{FILTERS}});

    let mut url = reqwest::Url::parse(search_url)?;
    let mut pairs = Vec::new();
    if let Some(object) = filters.as_object() {
        for (key, value) in object {
            if value.is_null() {
                continue;
            }
            let rendered = if let Some(array) = value.as_array() {
                array.iter().map(value_to_string).collect::<Vec<_>>().join(",")
            } else if value.is_object() {
                serde_json::to_string(value)?
            } else {
                value_to_string(value)
            };
            if !rendered.is_empty() {
                pairs.push((key.clone(), rendered));
            }
        }
    }

    {
        let mut query = url.query_pairs_mut();
        for (key, value) in &pairs {
            query.append_pair(key, value);
        }
    }

    let response = client.get(url).send().await?;
    let payload: Value = serde_json::from_str(&response.text().await?)?;
    if let Some(entries) = payload.get("collections").and_then(|value| value.as_array()) {
        for entry in entries {
            if let Some(id) = entry.get("id").and_then(|value| value.as_str()) {
                println!("{}", id);
            }
        }
    }

    Ok(())
}

fn value_to_string(value: &Value) -> String {
    if let Some(text) = value.as_str() {
        return text.to_string();
    }
    if let Some(number) = value.as_i64() {
        return number.to_string();
    }
    if let Some(number) = value.as_u64() {
        return number.to_string();
    }
    if let Some(number) = value.as_f64() {
        return number.to_string();
    }
    if let Some(boolean) = value.as_bool() {
        return boolean.to_string();
    }
    String::new()
}
