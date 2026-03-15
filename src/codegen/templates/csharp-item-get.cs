using System;
using System.Net.Http;

var httpClient = new HttpClient();
var searchUrl = "{{SEARCH_URL}}";
var queryString = "{{QUERY_STRING}}";

var requestUrl = string.IsNullOrEmpty(queryString) ? searchUrl : $"{searchUrl}?" + queryString;
var response = await httpClient.GetAsync(requestUrl);

var responseBody = await response.Content.ReadAsStringAsync();

using var doc = System.Text.Json.JsonDocument.Parse(responseBody);
if (doc.RootElement.TryGetProperty("{{RESULT_ARRAY_KEY}}", out var entries))
{
    foreach (var entry in entries.EnumerateArray())
    {
        if (entry.TryGetProperty("id", out var id))
        {
            Console.WriteLine(id.GetString());
        }
    }
}
