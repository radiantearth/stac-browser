using System;
using System.Net.Http;
using System.Text;

var httpClient = new HttpClient();
var searchUrl = "{{SEARCH_URL}}";

var json = """
{{FILTERS}}
""";
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await httpClient.SendAsync(new HttpRequestMessage(new HttpMethod("{{SEARCH_METHOD}}"), searchUrl)
{
    Content = content
});
var responseBody = await response.Content.ReadAsStringAsync();

using var doc = System.Text.Json.JsonDocument.Parse(responseBody);
if (doc.RootElement.TryGetProperty("collections", out var entries))
{
    foreach (var entry in entries.EnumerateArray())
    {
        if (entry.TryGetProperty("id", out var id))
        {
            Console.WriteLine(id.GetString());
        }
    }
}
