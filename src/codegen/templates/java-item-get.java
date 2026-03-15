import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class StacSearch {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String searchUrl = "{{SEARCH_URL}}";
        String queryString = "{{QUERY_STRING}}";
        String requestUrl = queryString.isEmpty() ? searchUrl : searchUrl + "?" + queryString;
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(requestUrl))
            .GET()
            .build();

        HttpResponse<String> response = client.send(
            request, HttpResponse.BodyHandlers.ofString());

        // Print item IDs
        Pattern pattern = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(response.body());
        while (matcher.find()) {
            System.out.println(matcher.group(1));
        }
    }
}
