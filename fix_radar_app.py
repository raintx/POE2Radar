import os
import re

path = r"src\POE2Radar.Overlay\RadarApp.cs"
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

conflict_pattern = re.compile(
    r'<<<<<<< HEAD\n\s*snap\.Entities, snap\.Landmarks, _hpPct, _manaPct, _esPct, _hpCur, _hpMax, _manaCur, _manaMax, _esCur, _esMax, _autoFlask, _flaskNote,\n\s*snap\.AreaCode, _charName, snap\.CharLevel, areaSeconds, _worldMs, _renderMs\);\n=======\n\s*snap\.Entities, snap\.Landmarks, _hpPct, _manaPct, _esPct, _autoFlask, _flaskNote,\n\s*snap\.AreaCode, _charName, snap\.CharLevel, _worldMs, _renderMs, mr\.Markers, _fps\);\n>>>>>>> upstream/main',
    re.MULTILINE
)

replacement = """              snap.Entities, snap.Landmarks, _hpPct, _manaPct, _esPct, _hpCur, _hpMax, _manaCur, _manaMax, _esCur, _esMax, _autoFlask, _flaskNote,
              snap.AreaCode, _charName, snap.CharLevel, areaSeconds, _worldMs, _renderMs, mr.Markers, _fps);"""

text = conflict_pattern.sub(replacement, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("RadarApp.cs conflict resolved")
