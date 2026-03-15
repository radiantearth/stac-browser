import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class StacSearch {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("__SEARCH_URL__"))
            .header("Content-Type", "application/json")
            .method("__SEARCH_METHOD__", HttpRequest.BodyPublishers.ofString(__FILTERS_STRING__))
            .build();

        HttpResponse<String> response = client.send(
            request, HttpResponse.BodyHandlers.ofString());

        Pattern pattern = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(response.body());
        while (matcher.find()) {
            System.out.println(matcher.group(1));
        }
    }
}
