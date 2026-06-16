import sys
import re

with open('src/POE2Radar.Overlay/WebRoot/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replace_with = """let timeStr = '';
  if (s.inGame && s.areaSeconds !== undefined && s.areaSeconds > 0) {
    const mins = Math.floor(s.areaSeconds / 60);
    const secs = s.areaSeconds % 60;
    timeStr = ` - ${mins}m ${secs}s`;
  }
  $('#areaChip').innerHTML = (areaName||s.areaCode||'—') + ' <b>· -</b> ' + (s.inGame ? (i18n.inGame || 'in game') : (i18n.menu || 'town/menu')) + timeStr;"""

# Let's just search for the line starting with   $('#areaChip').innerHTML
content = re.sub(r"^[ \t]*\$\('#areaChip'\)\.innerHTML = .*?;[ \t]*\r?\n", replace_with + "\n", content, flags=re.MULTILINE)

with open('src/POE2Radar.Overlay/WebRoot/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced areaChip successfully using regex")
