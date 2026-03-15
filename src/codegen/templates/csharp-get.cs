using System;
using System.Net.Http;

var url = "__REQUEST_URL__";
var httpClient = new HttpClient();
var response = await httpClient.GetAsync(url);
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
