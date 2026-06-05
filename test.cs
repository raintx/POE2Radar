using System;
using System.Text.Json;
using POE2Radar.Overlay.Web;

var state = RadarState.Empty with { CharClass = ""TestClass"" };
var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
Console.WriteLine(JsonSerializer.Serialize(state, options));
