const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
// Path palette — must match OverlayRenderer.PathPalette (route color by selection slot).
const PALETTE = ['#33E666','#FF8C1A','#4DB3FF','#FF4DB3','#F2E633','#9966FF','#33FFD9','#FF6666'];

let state=null, zone=null, entities=[], landmarks=[], selected=new Map(); // id -> color slot
let activeTab='dashboard', kindFilter='all', aliveOnly=true, search='';

/* ── tabs ── */
$$('.tab').forEach(t=>t.onclick=()=>{
  activeTab=t.dataset.tab;
  $$('.tab').forEach(x=>x.classList.toggle('on',x===t));
  $$('.view').forEach(v=>v.hidden = v.dataset.view!==activeTab);
  if(activeTab==='settings') loadSettings();
  if(activeTab==='filters') loadFilters();
  pump();
});

/* ── polling ── */
async function getJSON(u){ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw 0; return r.json(); }
function setConn(live){ $('#conn').classList.toggle('live',live); $('#connTxt').textContent = live?'live':'offline'; }

async function tick(){
  try{
    state = await getJSON('/state');
    setConn(true);
    try{ zone = await getJSON('/api/zone'); }catch(e){ zone=null; }
    renderState();
    if(activeTab==='dashboard'){
      [entities, landmarks] = await Promise.all([getJSON('/entities?limit=2000'), getJSON('/landmarks')]);
      await refreshNav();
    }
    pump();
  }catch(e){ setConn(false); }
}
function pump(){ if(activeTab==='dashboard') renderDashboard(); }

/* ── dashboard: unified, searchable navigation-target list (drives the in-game path) ── */
async function refreshNav(){
  try{ const n=await getJSON('/api/nav'); selected=new Map((n.selected||[]).map(x=>[x.id, x.slot])); }catch(e){}
}
async function navToggle(id){
  if(selected.has(id)) selected.delete(id); else selected.set(id, selected.size); // optimistic
  renderDashboard();
  try{ await fetch('/api/nav',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({toggle:id})}); }catch(e){}
  await refreshNav(); renderDashboard();
}
async function navClearAll(){
  selected.clear(); renderDashboard();
  try{ await fetch('/api/nav',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clear:true})}); }catch(e){}
  await refreshNav(); renderDashboard();
}
function prettify(m){
  if(!m) return 'Unknown';
  const s=m.split('/').pop().replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/\s*\d+$/,'').trim();
  return s||m;
}
function navRows(){
  const rows=[];
  for(const l of landmarks) rows.push({id:'t:'+l.path, name:l.curatedName||l.name||'Marco', kind:'Landmark', tag:'tile', dist:l.dist, key:l.path||''});
  for(const e of entities){
    if(aliveOnly && !e.alive) continue;
    const tag = e.poi ? 'POI' : (e.rarity && e.rarity!=='NonMonster' ? e.rarity : e.category);
    rows.push({id:'e:'+e.id, name:e.name||prettify(e.metadata), kind:e.category, tag, dist:e.dist, key:e.metadata||''});
  }
  return rows;
}
function renderDashboard(){
  let rows=navRows();
  if(kindFilter==='landmarks') rows=rows.filter(r=>r.kind==='Landmark');
  else if(kindFilter==='entities') rows=rows.filter(r=>r.kind!=='Landmark');
  if(search) rows=rows.filter(r=>r.name.toLowerCase().includes(search)||r.key.toLowerCase().includes(search));
  rows.sort((a,b)=>{ const sa=selected.has(a.id), sb=selected.has(b.id); if(sa!==sb) return sa?-1:1; return (a.dist||0)-(b.dist||0); });
  const shown=rows.slice(0,400);
  $('#navCount').textContent = rows.length+' alvos'+(rows.length>shown.length?' · mostrando 400':'');
  $('#navEmpty').hidden = rows.length>0;
  $('#navList').innerHTML = shown.map(r=>{
    const sel=selected.has(r.id), col=sel?PALETTE[(selected.get(r.id)||0)%8]:'';
    return `<div class="navrow${sel?' sel':''}" data-id="${(r.id||'').replace(/"/g,'&quot;')}">
      <span class="navbtn" style="${sel?'background:'+col+';border-color:'+col:''}">${sel?'●':'○'}</span>
      <span class="navname">${r.name}</span>
      <span class="navtag">${r.tag}</span>
      <span class="navdist">${r.dist}</span>
    </div>`;
  }).join('');
  $$('#navList .navrow').forEach(el=>el.onclick=()=>navToggle(el.dataset.id));
}
$('#navSearch').oninput=e=>{ search=e.target.value.toLowerCase(); renderDashboard(); };
$('#navAlive').onclick=()=>{ aliveOnly=!aliveOnly; $('#navAlive').classList.toggle('on',aliveOnly); renderDashboard(); };
$('#navClear').onclick=navClearAll;
$$('#kindChips .chip').forEach(c=>c.onclick=()=>{ kindFilter=c.dataset.kind; $$('#kindChips .chip').forEach(x=>x.classList.toggle('on',x===c)); renderDashboard(); });

/* ── settings tab (writes radar/visual + flask via the loopback-gated /api/settings) ── */
async function loadSettings(){
  try{
    const s = await getJSON('/api/settings');
    $$('[data-set]').forEach(el=>{
      const k=el.dataset.set;
      if(el.type==='checkbox') el.checked=!!s[k];
      else if(el.classList.contains('keyin')) el.value=vkToChar(s[k]);
      else if(s[k]!==undefined) el.value=s[k];
    });
    styles = s.styles || null;
    hpBars = s.hpBars || null;
    terrain = s.terrain || null;
    renderHpBars(); renderTerrain(); renderIcons(); renderMechanics();
  }catch(e){}
}
async function saveSetting(key,val){
  try{
    await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({[key]:val})});
    const m=$('#savedMsg'); m.classList.add('show'); clearTimeout(m._t); m._t=setTimeout(()=>m.classList.remove('show'),1100);
  }catch(e){}
}
function wireSettings(){
  $$('[data-set]').forEach(el=>{
    const k=el.dataset.set;
    if(el.type==='checkbox') el.onchange=()=>saveSetting(k,el.checked);
    else if(el.classList.contains('keyin')) el.onchange=()=>{ const vk=charToVk(el.value); if(vk) saveSetting(k,vk); el.value=vkToChar(vk); };
    else el.onchange=()=>{ const v=parseFloat(el.value); if(!isNaN(v)) saveSetting(k,v); };
  });
}
// Flask key inputs accept a single character ('1'-'9', letters) → Win32 VK (== ASCII of uppercase).
const charToVk = s => { const c=(s||'').trim().toUpperCase().charCodeAt(0); return isNaN(c)?0:c; };
const vkToChar = v => v ? String.fromCharCode(v) : '';

/* ── icon / HP-bar / mechanics editors (nested objects: POST the whole {styles}/{hpBars}) ── */
let styles=null, hpBars=null, terrain=null;
const ICON_KEYS=[
  ['monsterNormal','Monster · Normal'],['monsterMagic','Monster · Magic'],
  ['monsterRare','Monster · Rare'],['monsterUnique','Monster · Unique'],
  ['player','Player'],['npc','NPC'],['chestRare','Chest · Rare'],
  ['chestUnique','Chest · Unique'],['transition','Transition'],
  ['poi','Point of Interest'],['landmark','Landmark']];
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pct=o=>Math.round((o==null?1:o)*100);

/* ── SVG icon library (served by /api/icons): drives both the in-page previews and the picker grid. ── */
let ICONS=[]; const ICONMAP={};
async function loadIcons(){
  try{ ICONS=await getJSON('/api/icons')||[]; }catch(e){ ICONS=[]; }
  for(const k in ICONMAP) delete ICONMAP[k];
  ICONS.forEach(d=>ICONMAP[(d.name||'').toLowerCase()]=d);
}
const iconDef=name=>ICONMAP[(name||'').toLowerCase()]||null;
function iconSvg(name,color){
  const d=iconDef(name); if(!d) return '';
  const c=color||'currentColor';
  return `<svg viewBox="${d.viewBox}" preserveAspectRatio="xMidYMid meet">`
    + (d.paths||[]).map(p=>`<path d="${esc(p)}" fill="${c}"/>`).join('') + `</svg>`;
}
function pickerHtml(name,color){
  const d=iconDef(name), nm=d?d.name:(name||'Circle');
  return `<span class="iconpick" data-val="${esc(nm)}"><span class="ipreview" style="color:${color||'var(--ink)'}">`
    + iconSvg(nm,color) + `</span><span class="ipname">${esc(nm)}</span><span class="ipcar">▼</span></span>`;
}
function refreshPicker(pk,name,color){
  const d=iconDef(name), nm=d?d.name:(name||'Circle');
  pk.dataset.val=nm;
  const pv=pk.querySelector('.ipreview'); pv.style.color=color||'var(--ink)'; pv.innerHTML=iconSvg(nm,color);
  pk.querySelector('.ipname').textContent=nm;
}
let _iconPop=null;
function ensureIconPop(){
  if(_iconPop) return _iconPop;
  _iconPop=document.createElement('div'); _iconPop.id='iconPop'; document.body.appendChild(_iconPop);
  document.addEventListener('mousedown',e=>{
    if(_iconPop.classList.contains('open') && !_iconPop.contains(e.target) && !e.target.closest('.iconpick')) _iconPop.classList.remove('open');
  });
  return _iconPop;
}
function openIconPicker(anchor,current,cb){
  const pop=ensureIconPop();
  pop.innerHTML='<div class="ipop-grid">'+ICONS.map(d=>
    `<div class="ipop-cell${d.name.toLowerCase()===(current||'').toLowerCase()?' sel':''}" data-n="${esc(d.name)}" title="${esc(d.name)}">`
    + iconSvg(d.name) + `<span class="cn">${esc(d.name)}</span></div>`).join('')+'</div>';
  pop.querySelectorAll('.ipop-cell').forEach(c=>c.onclick=()=>{ pop.classList.remove('open'); cb(c.dataset.n); });
  pop.classList.add('open');
  const r=anchor.getBoundingClientRect(), pw=pop.offsetWidth, ph=pop.offsetHeight;
  let left=Math.min(r.left, innerWidth-8-pw), top=r.bottom+4;
  if(top+ph>innerHeight-8) top=Math.max(8, r.top-4-ph);
  pop.style.left=Math.max(8,left)+'px'; pop.style.top=top+'px';
}
const saveStyles=()=>{ if(styles) saveSetting('styles',styles); };
const saveHpBars=()=>{ if(hpBars) saveSetting('hpBars',hpBars); };

function renderHpBars(){
  if(!hpBars) return;
  $$('[data-hp]').forEach(el=>{ if(hpBars[el.dataset.hp]!==undefined) el.value=hpBars[el.dataset.hp]; });
  $$('[data-hpcolor]').forEach(el=>{ el.value=hpBars[el.dataset.hpcolor]||'#ffffff'; });
}
function wireHpBars(){
  $$('[data-hp]').forEach(el=>{ el.onchange=()=>{ const v=parseFloat(el.value); if(!isNaN(v)&&hpBars){ hpBars[el.dataset.hp]=v; saveHpBars(); } }; });
  $$('[data-hpcolor]').forEach(el=>{ el.onchange=()=>{ if(hpBars){ hpBars[el.dataset.hpcolor]=el.value; saveHpBars(); } }; });
}

/* ── terrain color/transparency (POSTs the whole {terrain} object; rebuilds the terrain bitmap) ── */
const saveTerrain=()=>{ if(terrain) saveSetting('terrain',terrain); };
function renderTerrain(){
  if(!terrain) return;
  $$('[data-tcolor]').forEach(el=>{ el.value=terrain[el.dataset.tcolor]||'#ffffff'; });
  $$('[data-topacity]').forEach(el=>{ el.value=Math.round((terrain[el.dataset.topacity]??1)*100); });
  $$('[data-topv]').forEach(el=>{ el.textContent=Math.round((terrain[el.dataset.topv]??1)*100)+'%'; });
}
function wireTerrain(){
  $$('[data-tcolor]').forEach(el=>{ el.onchange=()=>{ if(terrain){ terrain[el.dataset.tcolor]=el.value; saveTerrain(); } }; });
  $$('[data-topacity]').forEach(el=>{
    const k=el.dataset.topacity, v=$(`[data-topv="${k}"]`);
    el.oninput=()=>{ if(v) v.textContent=el.value+'%'; };
    el.onchange=()=>{ if(terrain){ terrain[k]=(+el.value)/100; saveTerrain(); } };
  });
}

function iconRow(key,label,o){
  return `<div class="stylerow" data-k="${key}">
    <label class="sw"><input type="checkbox" class="i-en"${o.enabled?' checked':''}><span class="track"></span><span class="knob"></span></label>
    <span class="nm">${label}</span>
    ${pickerHtml(o.shape,o.color)}
    <input type="color" class="i-color" value="${o.color||'#ffffff'}">
    <input type="range" class="op i-op" min="0" max="100" value="${pct(o.opacity)}">
    <span class="opv">${pct(o.opacity)}%</span>
    <input type="number" class="numin sz i-size" step="0.1" min="0.5" value="${o.size}">
  </div>`;
}
function renderIcons(){
  if(!styles){ $('#iconStyles').innerHTML=''; return; }
  $('#iconStyles').innerHTML=ICON_KEYS.map(([k,l])=>iconRow(k,l,styles[k]||{})).join('');
  $$('#iconStyles .stylerow').forEach(row=>{
    const o=styles[row.dataset.k]; if(!o) return;
    const pk=row.querySelector('.iconpick');
    row.querySelector('.i-en').onchange=e=>{ o.enabled=e.target.checked; saveStyles(); };
    pk.onclick=()=>openIconPicker(pk,o.shape,n=>{ o.shape=n; refreshPicker(pk,n,o.color); saveStyles(); });
    row.querySelector('.i-color').onchange=e=>{ o.color=e.target.value; refreshPicker(pk,o.shape,o.color); saveStyles(); };
    const op=row.querySelector('.i-op'), opv=row.querySelector('.opv');
    op.oninput=()=>{ opv.textContent=op.value+'%'; };
    op.onchange=()=>{ o.opacity=(+op.value)/100; saveStyles(); };
    row.querySelector('.i-size').onchange=e=>{ const v=parseFloat(e.target.value); if(!isNaN(v)){ o.size=v; saveStyles(); } };
  });
}

/* Entity categories a mechanic rule can be gated to (value = Poe2Live.EntityCategory name). Empty
   selection = applies to every category. Labels are friendlier than the raw enum names. */
const MECH_CATS=[['Monster','Monsters'],['Chest','Chests'],['Other','Misc / POI'],
  ['Object','Terrain'],['Npc','NPCs'],['Transition','Transitions']];
function mechRow(m,i){
  const cats=m.categories||[];
  return `<div class="mechrow" data-i="${i}">
    <div class="top">
      <label class="sw"><input type="checkbox" class="m-en"${m.enabled?' checked':''}><span class="track"></span><span class="knob"></span></label>
      <input class="mname" placeholder="Name (e.g. Expedition)" value="${esc(m.name)}">
      <button class="delbtn m-del">Remove</button>
    </div>
    <input class="matchin m-match" placeholder="match terms, comma-separated (e.g. Strongbox, StrongBoxes)" value="${esc((m.match||[]).join(', '))}">
    <div class="mcats"><span class="mcats-lbl">Applies to</span>${MECH_CATS.map(([v,l])=>
      `<label class="catchip${cats.includes(v)?' on':''}"><input type="checkbox" class="m-cat" data-cat="${v}"${cats.includes(v)?' checked':''}>${l}</label>`).join('')}
      <span class="mcats-hint">${cats.length?'':'all types'}</span></div>
    <div class="ctl">
      ${pickerHtml(m.shape,m.color)}
      <input type="color" class="m-color" value="${m.color||'#ffffff'}">
      <input type="range" class="op m-op" min="0" max="100" value="${pct(m.opacity)}">
      <span class="opv">${pct(m.opacity)}%</span>
      <input type="number" class="numin sz m-size" step="0.1" min="0.5" value="${m.size}">
    </div>
  </div>`;
}
function renderMechanics(){
  if(!styles){ $('#mechList').innerHTML=''; return; }
  styles.mechanics=styles.mechanics||[];
  $('#mechList').innerHTML=styles.mechanics.map((m,i)=>mechRow(m,i)).join('');
  $$('#mechList .mechrow').forEach(row=>{
    const m=styles.mechanics[+row.dataset.i]; if(!m) return;
    const pk=row.querySelector('.iconpick');
    row.querySelector('.m-en').onchange=e=>{ m.enabled=e.target.checked; saveStyles(); };
    row.querySelector('.mname').onchange=e=>{ m.name=e.target.value; saveStyles(); };
    row.querySelector('.m-match').onchange=e=>{ m.match=e.target.value.split(',').map(s=>s.trim()).filter(Boolean); saveStyles(); };
    row.querySelectorAll('.m-cat').forEach(cb=>{ cb.onchange=()=>{
      m.categories=[...row.querySelectorAll('.m-cat:checked')].map(c=>c.dataset.cat);
      cb.closest('.catchip').classList.toggle('on',cb.checked);
      const h=row.querySelector('.mcats-hint'); if(h) h.textContent=m.categories.length?'':'all types';
      saveStyles(); }; });
    pk.onclick=()=>openIconPicker(pk,m.shape,n=>{ m.shape=n; refreshPicker(pk,n,m.color); saveStyles(); });
    row.querySelector('.m-color').onchange=e=>{ m.color=e.target.value; refreshPicker(pk,m.shape,m.color); saveStyles(); };
    const op=row.querySelector('.m-op'), opv=row.querySelector('.opv');
    op.oninput=()=>{ opv.textContent=op.value+'%'; };
    op.onchange=()=>{ m.opacity=(+op.value)/100; saveStyles(); };
    row.querySelector('.m-size').onchange=e=>{ const v=parseFloat(e.target.value); if(!isNaN(v)){ m.size=v; saveStyles(); } };
    row.querySelector('.m-del').onclick=()=>{ styles.mechanics.splice(+row.dataset.i,1); renderMechanics(); saveStyles(); };
  });
}
$('#mechAdd').onclick=()=>{ if(!styles) return; styles.mechanics=styles.mechanics||[]; styles.mechanics.push({enabled:true,name:'New',match:[],shape:'Star',color:'#ffd926',opacity:1,size:6}); renderMechanics(); saveStyles(); };

/* ── Filters tab: Watched highlight rules + Hidden cull patterns + Auto-path patterns ── */
let watched=[], hidden=[], autoNav=[], lmpat=[];
const AUTONAV_SUGGEST=['AreaTransition','Waypoint','Checkpoint','QuestChest','QuestObject','Shrine','Strongbox','ExpeditionEncounter','Ritual','Breach'];
const LMPAT_SUGGEST=['Vendor','Sanctum','Trial','Vaal','Waygate','Arena','Strongbox'];
function flashF(){ const m=$('#savedMsgF'); if(!m) return; m.classList.add('show'); clearTimeout(m._t); m._t=setTimeout(()=>m.classList.remove('show'),1100); }
async function postWatched(body){ try{ await fetch('/api/watched',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); flashF(); }catch(e){} }
async function postHidden(body){ try{ await fetch('/api/hidden',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); flashF(); }catch(e){} }
async function loadFilters(){
  try{ const w=await getJSON('/api/watched'); watched=w.rules||[]; }catch(e){ watched=[]; }
  try{ const h=await getJSON('/api/hidden'); hidden=h.patterns||[]; }catch(e){ hidden=[]; }
  try{ const s=await getJSON('/api/settings'); autoNav=s.autoNavPatterns||[]; }catch(e){ autoNav=[]; }
  try{ const l=await getJSON('/api/landmark-patterns'); lmpat=l.patterns||[]; }catch(e){ lmpat=[]; }
  renderWatched(); renderHidden(); renderAutoNav(); renderLmpat();
}
function watchRow(w){
  return `<div class="mechrow" data-p="${esc(w.pattern)}">
    <div class="top">
      <label class="sw"><input type="checkbox" class="w-en"${w.enabled?' checked':''}><span class="track"></span><span class="knob"></span></label>
      <input class="mname w-label" value="${esc(w.label)}" placeholder="label">
      <button class="delbtn w-del">Remove</button>
    </div>
    <div class="matchin" style="border:none;padding:0 0 6px;color:var(--ink-faint)">matches: <code>${esc(w.pattern)}</code></div>
    <div class="ctl">
      ${pickerHtml(w.shape,w.color)}
      <input type="color" class="w-color" value="${w.color||'#ffffff'}">
      <input type="number" class="numin sz w-size" step="0.1" min="0.5" value="${w.size}">
    </div>
  </div>`;
}
function renderWatched(){
  $('#watchList').innerHTML = watched.map(watchRow).join('') || '<div class="row"><div class="rl hint-row">No watch rules yet.</div></div>';
  $$('#watchList .mechrow').forEach(row=>{
    const p=row.dataset.p, w=watched.find(x=>x.pattern===p); if(!w) return;
    const pk=row.querySelector('.iconpick');
    row.querySelector('.w-en').onchange=e=>{ w.enabled=e.target.checked; postWatched({update:{pattern:p,enabled:w.enabled}}); };
    row.querySelector('.w-label').onchange=e=>{ w.label=e.target.value; postWatched({update:{pattern:p,label:w.label}}); };
    pk.onclick=()=>openIconPicker(pk,w.shape,n=>{ w.shape=n; refreshPicker(pk,n,w.color); postWatched({update:{pattern:p,shape:n}}); });
    row.querySelector('.w-color').onchange=e=>{ w.color=e.target.value; refreshPicker(pk,w.shape,w.color); postWatched({update:{pattern:p,color:w.color}}); };
    row.querySelector('.w-size').onchange=e=>{ const v=parseFloat(e.target.value); if(!isNaN(v)){ w.size=v; postWatched({update:{pattern:p,size:v}}); } };
    row.querySelector('.w-del').onclick=()=>{ postWatched({remove:p}).then(loadFilters); };
  });
}
$('#watchAdd').onclick=()=>{
  const pattern=$('#watchPattern').value.trim(); if(!pattern) return;
  const label=$('#watchLabel').value.trim()||pattern;
  $('#watchPattern').value=''; $('#watchLabel').value='';
  postWatched({add:{pattern,label,color:'#ffd926',shape:'Diamond',size:7}}).then(loadFilters);
};
function renderHidden(){
  $('#hideList').innerHTML = hidden.length ? hidden.map(p=>
    `<span class="chip on" data-p="${esc(p)}">${esc(p)} <b style="margin-left:5px;cursor:pointer">&#10005;</b></span>`).join('')
    : '<span style="color:var(--ink-faint);font-size:11px;font-style:italic">Nothing hidden.</span>';
  $$('#hideList .chip').forEach(c=>c.querySelector('b').onclick=()=>{ postHidden({remove:c.dataset.p}).then(loadFilters); });
}
$('#hideAdd').onclick=()=>{
  const p=$('#hidePattern').value.trim(); if(!p) return;
  $('#hidePattern').value='';
  postHidden({add:p}).then(loadFilters);
};
$('#hidePattern').onkeydown=e=>{ if(e.key==='Enter') $('#hideAdd').click(); };

async function saveAutoNav(){ try{ await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({autoNavPatterns:autoNav})}); flashF(); }catch(e){} }
function renderAutoNav(){
  $('#autoNavList').innerHTML = autoNav.length ? autoNav.map(p=>
    `<span class="chip on" data-p="${esc(p)}">${esc(p)} <b style="margin-left:5px;cursor:pointer">&#10005;</b></span>`).join('')
    : '<span style="color:var(--ink-faint);font-size:11px;font-style:italic">Auto-path disabled (no patterns).</span>';
  $$('#autoNavList .chip').forEach(c=>c.querySelector('b').onclick=()=>{ autoNav=autoNav.filter(x=>x!==c.dataset.p); renderAutoNav(); saveAutoNav(); });
  $('#autoNavSuggest').innerHTML = AUTONAV_SUGGEST.map(p=>{
    const on=autoNav.some(x=>x.toLowerCase()===p.toLowerCase());
    return `<span class="chip${on?' on':''}" data-s="${esc(p)}">${esc(p)}</span>`;
  }).join('');
  $$('#autoNavSuggest .chip').forEach(c=>c.onclick=()=>{
    const p=c.dataset.s; if(autoNav.some(x=>x.toLowerCase()===p.toLowerCase())) return;
    autoNav.push(p); renderAutoNav(); saveAutoNav();
  });
}
$('#autoNavAdd').onclick=()=>{
  const p=$('#autoNavPattern').value.trim(); if(!p) return;
  if(!autoNav.some(x=>x.toLowerCase()===p.toLowerCase())) autoNav.push(p);
  $('#autoNavPattern').value=''; renderAutoNav(); saveAutoNav();
};
$('#autoNavPattern').onkeydown=e=>{ if(e.key==='Enter') $('#autoNavAdd').click(); };

/* ── landmark tile patterns (user-surfaced terrain landmarks) ── */
async function postLmpat(body){ try{ await fetch('/api/landmark-patterns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); flashF(); }catch(e){} }
function lmpatRow(p){
  return `<div class="mechrow" data-p="${esc(p.pattern)}">
    <div class="top">
      <label class="sw"><input type="checkbox" class="lp-en"${p.enabled?' checked':''}><span class="track"></span><span class="knob"></span></label>
      <input class="mname lp-label" value="${esc(p.label)}" placeholder="label (optional)" data-i18n-ph="lmlabelPh">
      <button class="delbtn lp-del">Remove</button>
    </div>
    <div class="matchin" style="border:none;padding:0;color:var(--ink-faint)">matches tile path: <code>${esc(p.pattern)}</code></div>
  </div>`;
}
function renderLmpat(){
  $('#lmpatList').innerHTML = lmpat.map(lmpatRow).join('') || '<div class="row"><div class="rl hint-row">No custom landmark patterns. Built-in features still show.</div></div>';
  $$('#lmpatList .mechrow').forEach(row=>{
    const p=row.dataset.p, e=lmpat.find(x=>x.pattern===p); if(!e) return;
    row.querySelector('.lp-en').onchange=ev=>{ e.enabled=ev.target.checked; postLmpat({update:{pattern:p,enabled:e.enabled}}); };
    row.querySelector('.lp-label').onchange=ev=>{ e.label=ev.target.value; postLmpat({update:{pattern:p,label:e.label}}); };
    row.querySelector('.lp-del').onclick=()=>{ postLmpat({remove:p}).then(loadFilters); };
  });
  $('#lmpatSuggest').innerHTML = LMPAT_SUGGEST.map(s=>{
    const on=lmpat.some(x=>x.pattern.toLowerCase()===s.toLowerCase());
    return `<span class="chip${on?' on':''}" data-s="${esc(s)}">${esc(s)}</span>`;
  }).join('');
  $$('#lmpatSuggest .chip').forEach(c=>c.onclick=()=>{
    const s=c.dataset.s; if(lmpat.some(x=>x.pattern.toLowerCase()===s.toLowerCase())) return;
    postLmpat({add:{pattern:s}}).then(loadFilters);
  });
}
$('#lmpatAdd').onclick=()=>{
  const p=$('#lmpatPattern').value.trim(); if(!p) return;
  const l=$('#lmpatLabel').value.trim();
  $('#lmpatPattern').value=''; $('#lmpatLabel').value='';
  postLmpat({add:{pattern:p,label:l}}).then(loadFilters);
};
$('#lmpatPattern').onkeydown=e=>{ if(e.key==='Enter') $('#lmpatAdd').click(); };

/* ── left rail ── */
function renderState(){
  const s=state; if(!s) return;
  const hp=Math.max(0,Math.min(100,s.hpPct||0)), mp=Math.max(0,Math.min(100,s.manaPct||0)), es=Math.max(0,Math.min(100,s.esPct||0));
  $('#hpBar').style.width=hp+'%'; $('#mpBar').style.width=mp+'%'; $('#esBar').style.width=es+'%';
  $('#hpNum').textContent = `${s.hpCur}/${s.hpMax} (${hp.toFixed(0)}%)`;
  $('#mpNum').textContent = `${s.manaCur}/${s.manaMax} (${mp.toFixed(0)}%)`;
  $('#esNum').textContent = `${s.esCur}/${s.esMax} (${es.toFixed(0)}%)`;
  const areaName=(s.areaName&&s.areaName!==s.areaCode)?s.areaName:'';
  $('#kAreaName').textContent=areaName||s.areaCode||'—';
  $('#kArea').textContent=s.areaCode||'—';
  const act=s.areaAct||0;
  $('#kAlvl').textContent=(act?`${i18n.act} ${act} · `:'')+(s.areaLevel?(`${i18n.areaLvlNum} ${s.areaLevel}`):'—');
  
  // Streamer Mode / Char Info
  const isStreamer = $('#setStreamer').checked;
  const name = s.charName || i18n.you;
  const cls = s.charClass || '?';
  const lvl = s.charLevel ? 'Lvl ' + s.charLevel : '';
  
  if (isStreamer) {
    $('#charBox').hidden = false;
    $('#cbName').textContent = i18n.hidden;
    $('#cbClass').textContent = cls;
    $('#cbLvl').textContent = '';
  } else {
    $('#charBox').hidden = false;
    $('#cbName').textContent = name;
    $('#cbClass').textContent = cls;
    $('#cbLvl').textContent = lvl ? `> ${lvl}` : '';
  }

  // Active Map Time
  if (s.inGame && s.areaSeconds != null && s.areaSeconds > 0) {
    const mins = Math.floor(s.areaSeconds / 60);
    const secs = s.areaSeconds % 60;
    $('#kTime').textContent = `${mins}m ${secs}s`;
  } else {
    $('#kTime').textContent = '—';
  }

  $('#kMap').textContent=s.mapVisible?i18n.yes:i18n.no;
  $('#kFlask').textContent=(s.autoFlask?i18n.on:i18n.off)+(s.flask?' · '+s.flask:'');
  const fs=$('#flaskState'); if(fs) fs.textContent=(s.autoFlask?'LIGADO':'DESLIGADO')+(s.flask?' · '+s.flask:'');
  $('#cEnt').textContent=s.entityCount||0;
  $('#cPoi').textContent=s.poiCount||0;
  $('#cMon').textContent=(s.counts&&s.counts.Monster)||0;
  $('#cLm').textContent=s.landmarkCount||0;
  $('#areaChip').innerHTML = (areaName||s.areaCode||'—') + ' <b>·</b> ' + (s.inGame?i18n.inGame:i18n.menu);

  // Zone leveling notes (from /api/zone): title + note text, hidden when there's nothing to show.
  const zn=$('#zoneNotes');
  if(zone && (zone.notes||'').trim()){
    zn.hidden=false;
    zn.innerHTML='<div class="zt">'+esc(zone.title||zone.name||'')+'</div>'+esc(zone.notes);
  } else { zn.hidden=true; }
}

wireSettings(); wireHpBars(); wireTerrain(); loadIcons().then(loadSettings);
tick(); setInterval(tick, 1000);