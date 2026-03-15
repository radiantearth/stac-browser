import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class StacSearch {
    public static void main(String[] args) throws Exception {
/// if IS_POST ///
        String url = "__SEARCH_URL__";
        String json = """
__REQUEST_BODY__
""";
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .method("__SEARCH_METHOD__", HttpRequest.BodyPublishers.ofString(json))
            .build();
/// else ///
        String url = "__REQUEST_URL__";
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();
/// endif ///

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        JsonObject result = JsonParser.parseString(response.body()).getAsJsonObject();
        JsonArray entries = result.getAsJsonArray("__RESULT_ARRAY_KEY__");
        if (entries != null) {
            for (JsonElement entry : entries) {
                JsonElement id = entry.getAsJsonObject().get("id");
                if (id != null) {
                    System.out.println(id.getAsString());
                }
            }
        }
    }
}
