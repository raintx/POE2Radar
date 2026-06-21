import os

js_path = r"src\POE2Radar.Overlay\WebRoot\js\i18n.js"

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

if 'monoTitle' not in js:
    js = js.replace('"tabRules":', '"monoTitle": "Recompensas de Monolitos", "holes": "engastes", "tabRules":')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("i18n.js updated")
