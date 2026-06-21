import re

app_js_path = r"src\POE2Radar.Overlay\WebRoot\js\app.js"
index_html_path = r"src\POE2Radar.Overlay\WebRoot\index.html"

# Update index.html
with open(index_html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Add Monolith card if not exists
if 'id="monoCard"' not in html:
    html = html.replace('<div style="height:24px"></div>', """
      <div id="monoCard" hidden>
        <div class="sect" data-i18n="monoTitle">Recompensas de Monolitos</div>
        <div id="monoList" class="znotes" style="display:block"></div>
      </div>
      <div style="height:24px"></div>""", 1)

with open(index_html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# Update app.js
with open(app_js_path, 'r', encoding='utf-8') as f:
    js = f.read()

monolith_js = """
  const mc=$('#monoCard'), ml=$('#monoList');
  const monos=(s.monoliths||[]).slice().sort((a,b)=>(b.bestEx||0)-(a.bestEx||0));
  if(monos.length && mc && ml){
    mc.hidden=false;
    ml.innerHTML = monos.map(m=>{
      const tier = (m.bestEx||0)>=30 ? '#66e066' : (m.bestEx||0)>=18 ? '#e6c84d' : '#cfcfcf';
      const hdr = (m.bestEx>0?('<b style="color:'+tier+'">'+Math.round(m.bestEx)+' ex</b> · '):'')
                + '<span style="color:#e0b341">'+esc(m.anchor)+'</span>'
                + (m.holes>0?(' · '+m.holes+' holes'):'');
      const rows = m.rewards.map(r=>'<div style="display:flex;justify-content:space-between"><span class="tc">'+esc(r.tag)+'</span><span>'+(r.ex>0?(Math.round(r.ex)+'ex'):'')+'</span></div>').join('');
      return '<div style="margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.05)"><div style="font-size:12px;opacity:.8;margin-bottom:2px">'+hdr+'</div>'+rows+'</div>';
    }).join('');
  } else if(mc) {
    mc.hidden=true;
  }
"""

if 'monoliths' not in js:
    # Inject before: if(s.fps) {
    js = js.replace('if(s.fps)', monolith_js + '\n  if(s.fps)')

with open(app_js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("HTML and JS updated with Monoliths")
