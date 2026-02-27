import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("{{SEARCH_URL}}"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString({{BODY_STRING}}))
    .build();

HttpResponse<String> response = client.send(
    request, HttpResponse.BodyHandlers.ofString());

// Print item IDs
Pattern pattern = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
Matcher matcher = pattern.matcher(response.body());
while (matcher.find()) {
    System.out.println(matcher.group(1));
}