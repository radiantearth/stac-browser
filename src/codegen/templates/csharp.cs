using System;
using System.Net.Http;
/// if IS_POST ///
using System.Text;
/// endif ///

var httpClient = new HttpClient();
/// if IS_POST ///
var url = "__SEARCH_URL__";
var json = """
__REQUEST_BODY__
""";
var content = new StringContent(json, Encoding.UTF8, "application/json");
var method = new HttpMethod("__SEARCH_METHOD__");
var response = await httpClient.SendAsync(new HttpRequestMessage(method, url)
{
    Content = content
});
/// else ///
var url = "__REQUEST_URL__";
var response = await httpClient.GetAsync(url);
/// endif ///
var responseBody = await response.Content.ReadAsStringAsync();

using var doc = System.Text.Json.JsonDocument.Parse(responseBody);
if (doc.RootElement.TryGetProperty("__RESULT_ARRAY_KEY__", out var entries))
{
    foreach (var entry in entries.EnumerateArray())
    {
        if (entry.TryGetProperty("id", out var id))
        {
            Console.WriteLine(id.GetString());
        }
    }
}
