using System;
using System.Net.Http;
using System.Text;

var httpClient = new HttpClient();
var searchUrl = "{{SEARCH_URL}}";
var json = """
{{FILTERS}}
""";
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await httpClient.PostAsync(searchUrl, content);
var responseBody = await response.Content.ReadAsStringAsync();

using var doc = System.Text.Json.JsonDocument.Parse(responseBody);
foreach (var feature in doc.RootElement.GetProperty("features").EnumerateArray())
{
    Console.WriteLine(feature.GetProperty("id").GetString());
}
