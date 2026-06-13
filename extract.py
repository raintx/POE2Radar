import re

with open('f:\\RF\\Poe2\\src\\POE2Radar.Overlay\\Web\\DashboardHtml.cs', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract the big HTML string
match = re.search(r'public const string Page = """\s*(<!DOCTYPE html>.*?)\s*""";', text, re.DOTALL)
if not match:
    print("Failed to find Page literal")
    exit(1)

html_content = match.group(1)

# Extract CSS
style_match = re.search(r'<style>(.*?)</style>', html_content, re.DOTALL)
css_content = style_match.group(1).strip() if style_match else ''

# Extract JS
script_match = re.search(r'<script>(.*?)</script>', html_content, re.DOTALL)
js_content = script_match.group(1).strip() if script_match else ''

# Clean up HTML
clean_html = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="css/styles.css">', html_content, flags=re.DOTALL)
clean_html = re.sub(r'<script>.*?</script>', '<script src="js/i18n.js"></script>\n<script src="js/app.js"></script>', clean_html, flags=re.DOTALL)

# Split JS into i18n and app
i18n_split = js_content.split('// -- i18n and init --')
app_js = i18n_split[0].strip()
i18n_js = '// -- i18n and init --\n' + i18n_split[1].strip() if len(i18n_split) > 1 else ''

with open('f:\\RF\\Poe2\\src\\POE2Radar.Overlay\\WebRoot\\index.html', 'w', encoding='utf-8') as f:
    f.write(clean_html)

with open('f:\\RF\\Poe2\\src\\POE2Radar.Overlay\\WebRoot\\css\\styles.css', 'w', encoding='utf-8') as f:
    f.write(css_content)

with open('f:\\RF\\Poe2\\src\\POE2Radar.Overlay\\WebRoot\\js\\app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

with open('f:\\RF\\Poe2\\src\\POE2Radar.Overlay\\WebRoot\\js\\i18n.js', 'w', encoding='utf-8') as f:
    f.write(i18n_js)

print("Extraction complete!")
