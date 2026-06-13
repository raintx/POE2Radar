const $ = s => document.querySelector(s);

const $$ = s => [...document.querySelectorAll(s)];

let state=null, zone=null;

let activeTab='filters';

let atlasData=null, atlasView='region', atlasSel=new Set(), atlasHl=null, atlasArrow=null, atlasHlSelOnly=false;



/* тФАтФА tabs тФАтФА */

$$('.tab').forEach(t=>t.onclick=()=>{

  activeTab=t.dataset.tab;

  $$('.tab').forEach(x=>x.classList.toggle('on',x===t));

  $$('.view').forEach(v=>v.hidden = v.dataset.view!==activeTab);

  if(activeTab==='settings') loadSettings();

  if(activeTab==='filters') loadFilters();

  if(activeTab==='landmarks') loadLandmarks();

  if(activeTab==='atlas'){ if(!atlasData) loadAtlas(); else renderAtlas(); }

});



/* тФАтФА polling (left rail vitals/zone/census) тФАтФА */

async function getJSON(u){ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw 0; return r.json(); }

function setConn(live){ $('#conn').classList.toggle('live',live); $('#connTxt').textContent = live?'live':'offline'; }



async function tick(){

  try{

    state = await getJSON('/state');

    setConn(true);

    try{ zone = await getJSON('/api/zone'); }catch(e){ zone=null; }

    renderState();

  }catch(e){ setConn(false); }

}



/* тФАтФА settings tab (writes radar/visual + flask via the loopback-gated /api/settings) тФАтФА */

async function loadSettings(){

  try{

    const s = await getJSON('/api/settings');

    $$('[data-set]').forEach(el=>{

      const k=el.dataset.set;

      if(el.type==='checkbox') el.checked=!!s[k];

      else if(el.classList.contains('keyin')) el.value=vkToChar(s[k]);

      else if(s[k]!==undefined) el.value=s[k];

    });

    hpBars = s.hpBars || null;

    terrain = s.terrain || null;

    renderHpBars(); renderTerrain();

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

    else if(el.tagName==='SELECT') el.onchange=()=>saveSetting(k,el.value); // string value (e.g. flask mode)

    else el.onchange=()=>{ const v=parseFloat(el.value); if(!isNaN(v)) saveSetting(k,v); };

  });

}

// Flask key inputs accept a single character ('1'-'9', letters) тЖТ Win32 VK (== ASCII of uppercase).

const charToVk = s => { const c=(s||'').trim().toUpperCase().charCodeAt(0); return isNaN(c)?0:c; };

const vkToChar = v => v ? String.fromCharCode(v) : '';



/* тФАтФА icon / HP-bar / mechanics editors (nested objects: POST the whole {styles}/{hpBars}) тФАтФА */

let styles=null, hpBars=null, terrain=null;

const ICON_KEYS=[

  ['monsterNormal','Monster ┬╖ Normal'],['monsterMagic','Monster ┬╖ Magic'],

  ['monsterRare','Monster ┬╖ Rare'],['monsterUnique','Monster ┬╖ Unique'],

  ['player','Player'],['npc','NPC'],['chestRare','Chest ┬╖ Rare'],

  ['chestUnique','Chest ┬╖ Unique'],['transition','Transition'],

  ['poi','Point of Interest'],['landmark','Landmark']];

const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const pct=o=>Math.round((o==null?1:o)*100);



/* тФАтФА SVG icon library (served by /api/icons): drives both the in-page previews and the picker grid. тФАтФА */

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

    + iconSvg(nm,color) + `</span><span class="ipname">${esc(nm)}</span><span class="ipcar">тЦ╝</span></span>`;

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



/* тФАтФА terrain color/transparency (POSTs the whole {terrain} object; rebuilds the terrain bitmap) тФАтФА */

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

/* тФАтФА Rules tab: unified Display Rules + Hidden cull patterns тФАтФА */

let hidden=[], drules=[];

function flashF(){ const m=$('#savedMsgF'); if(!m) return; m.classList.add('show'); clearTimeout(m._t); m._t=setTimeout(()=>m.classList.remove('show'),1100); }

async function postHidden(body){ try{ await fetch('/api/hidden',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); flashF(); }catch(e){} }

async function loadFilters(){

  await loadModVocab();   // populate the mods autocomplete BEFORE rendering rule rows reference it

  await loadDrules();

  try{ const h=await getJSON('/api/hidden'); hidden=h.patterns||[]; }catch(e){ hidden=[]; }

  renderHidden();

}

/* The persistent monster-mod catalog feeds the <datalist> the Mods matcher autocompletes against, so

   you can pick a known aura/buff id instead of recalling it. Refreshed each time the Rules tab loads. */

async function loadModVocab(){

  let mods=[]; try{ const r=await getJSON('/api/mods'); mods=(r&&r.mods)||[]; }catch(_){ mods=[]; }

  let dl=document.getElementById('modVocab');

  if(!dl){ dl=document.createElement('datalist'); dl.id='modVocab'; document.body.appendChild(dl); }

  dl.innerHTML=mods.map(m=>`<option value="${esc(m)}">`).join('');

}



/* тФАтФА Display Rules: the unified ordered ruleset. The page holds the array, edits it, and re-POSTs

   the WHOLE list on any change (add / remove / reorder / toggle / field) тАФ same pattern styles used. тФАтФА */

const DR_CATS=['Monster','Chest','Npc','Object','Other','Transition','Player','Tile'];

const DR_SELECTS=[['rarity','Rarity',['Normal','Magic','Rare','Unique']],['reaction','Reaction',['Hostile','Friendly']],

  ['life','Life',['Alive','Dead']],['chest','Chest',['Opened','Unopened']],['poi','POI',['Yes','No']],['encounter','Encounter',['Active','Complete']]];

async function saveDrules(){ try{ await fetch('/api/display-rules',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:drules})}); flashF(); }catch(e){} }

async function loadDrules(){ try{ const r=await getJSON('/api/display-rules'); drules=r.rules||[]; }catch(e){ drules=[]; } renderDrules(); }

function drSel(f,l,o,cur){ return `<label class="drsel">${l}<select class="dr-cond" data-f="${f}"><option value=""${!cur?' selected':''}>any</option>`

  +o.map(x=>`<option${cur===x?' selected':''}>${x}</option>`).join('')+`</select></label>`; }

/* Concise matcherтЖТaction summary shown on the collapsed row so the list stays scannable. */

function drSummary(r){

  const p=[];

  p.push((r.categories&&r.categories.length)?r.categories.join('/'):'any type');

  if(r.match&&r.match.length) p.push('тАЬ'+r.match.join(', ')+'тАЭ');

  if(r.mods&&r.mods.length) p.push('mods: '+r.mods.join(', '));

  ['rarity','reaction','life','chest','poi','encounter'].forEach(f=>{ if(r[f]) p.push(r[f]); });

  return esc(p.join(' ┬╖ '));

}

function drRow(r,i){

  const open=!!r._open, cats=r.categories||[];

  const badges=(r.hide?'<span class="drbadge hide">hide</span>':'')

    +(r.navigable?'<span class="drbadge">path</span>':'');

  const body=open?`<div class="drbody">

      <div class="top"><input class="mname dr-name" value="${esc(r.name)}" placeholder="rule name"></div>

      <input class="matchin dr-match" placeholder="match: metadata terms, comma-separated (blank = any)" value="${esc((r.match||[]).join(', '))}">

      <input class="matchin dr-mods" list="modVocab" placeholder="monster mods: aura/buff terms, comma-separated (e.g. Aura, ManaSiphon) тАФ blank = any" value="${esc((r.mods||[]).join(', '))}">

      <div class="mcats"><span class="mcats-lbl">Type</span>${DR_CATS.map(c=>

        `<label class="catchip${cats.includes(c)?' on':''}"><input type="checkbox" class="dr-cat" data-cat="${c}"${cats.includes(c)?' checked':''}>${c}</label>`).join('')}</div>

      <div class="drconds">${DR_SELECTS.map(([f,l,o])=>drSel(f,l,o,r[f])).join('')}</div>

      <div class="ctl">

        <label class="drflag dr-hideflag" title="hide matching entities entirely"><input type="checkbox" class="dr-hide"${r.hide?' checked':''}> Hide</label>

        ${pickerHtml(r.shape,r.color)}

        <input type="color" class="dr-color" value="${r.color||'#ffffff'}">

        <input type="range" class="op dr-op" min="0" max="100" value="${pct(r.opacity)}"><span class="opv">${pct(r.opacity)}%</span>

        <input type="number" class="numin sz dr-size" step="0.1" min="0.5" value="${r.size}">

        <input class="mname dr-label" style="flex:1;min-width:70px" value="${esc(r.label||'')}" placeholder="label (optional)">

        <label class="drflag" title="qualify as an auto-path navigation target"><input type="checkbox" class="dr-nav"${r.navigable?' checked':''}> Auto-path</label>

      </div>

    </div>`:'';

  return `<div class="mechrow drrow${r.hide?' hideon':''}${open?' open':''}${r.enabled?'':' off'}" data-i="${i}">

    <div class="drhead">

      <label class="sw" title="enabled"><input type="checkbox" class="dr-en"${r.enabled?' checked':''}><span class="track"></span><span class="knob"></span></label>

      <span class="drcaret">${open?'тЦ╛':'тЦ╕'}</span>

      <span class="drswatch" style="color:${r.color||'#fff'}">${r.hide?'':iconSvg(r.shape,r.color)}</span>

      <span class="drnm">${esc(r.name||'(unnamed)')}</span>

      <span class="drsum">${drSummary(r)}</span>

      <span class="drbadges">${badges}</span>

      <span class="drord"><button class="ordbtn dr-up" title="higher precedence">тЦ▓</button><button class="ordbtn dr-dn" title="lower precedence">тЦ╝</button></span>

      <button class="delbtn dr-del" title="remove">тЬХ</button>

    </div>

    ${body}

  </div>`;

}

function renderDrules(){

  const host=$('#drList'); if(!host) return;

  host.innerHTML = drules.length ? drules.map(drRow).join('') : '<div class="row"><div class="rl hint-row">No display rules yet. Add one below.</div></div>';

  $$('#drList .drrow').forEach(row=>{

    const i=+row.dataset.i, r=drules[i]; if(!r) return;

    const save=saveDrules;

    // Header (always present): click anywhere except a control toggles expand.

    row.querySelector('.drhead').onclick=e=>{ if(e.target.closest('input,button,select,label,.drord')) return; r._open=!r._open; renderDrules(); };

    row.querySelector('.dr-en').onchange=e=>{ r.enabled=e.target.checked; row.classList.toggle('off',!r.enabled); save(); };

    row.querySelector('.dr-up').onclick=()=>{ if(i>0){ const t=drules[i-1]; drules[i-1]=drules[i]; drules[i]=t; renderDrules(); save(); } };

    row.querySelector('.dr-dn').onclick=()=>{ if(i<drules.length-1){ const t=drules[i+1]; drules[i+1]=drules[i]; drules[i]=t; renderDrules(); save(); } };

    row.querySelector('.dr-del').onclick=()=>{ drules.splice(i,1); renderDrules(); save(); };

    if(!r._open) return; // body controls only exist when expanded

    const pk=row.querySelector('.iconpick');

    row.querySelector('.dr-name').onchange=e=>{ r.name=e.target.value; save(); };

    row.querySelector('.dr-match').onchange=e=>{ r.match=e.target.value.split(',').map(s=>s.trim()).filter(Boolean); save(); };

    row.querySelector('.dr-mods').onchange=e=>{ r.mods=e.target.value.split(',').map(s=>s.trim()).filter(Boolean); save(); };

    row.querySelectorAll('.dr-cat').forEach(cb=>cb.onchange=()=>{ r.categories=[...row.querySelectorAll('.dr-cat:checked')].map(c=>c.dataset.cat); cb.closest('.catchip').classList.toggle('on',cb.checked); save(); });

    row.querySelectorAll('.dr-cond').forEach(sel=>sel.onchange=()=>{ r[sel.dataset.f]=sel.value||null; save(); });

    row.querySelector('.dr-hide').onchange=e=>{ r.hide=e.target.checked; row.classList.toggle('hideon',r.hide); save(); };

    pk.onclick=()=>openIconPicker(pk,r.shape,n=>{ r.shape=n; refreshPicker(pk,n,r.color); save(); });

    row.querySelector('.dr-color').onchange=e=>{ r.color=e.target.value; refreshPicker(pk,r.shape,r.color); save(); };

    const op=row.querySelector('.dr-op'),opv=row.querySelector('.opv'); op.oninput=()=>opv.textContent=op.value+'%'; op.onchange=()=>{ r.opacity=(+op.value)/100; save(); };

    row.querySelector('.dr-size').onchange=e=>{ const v=parseFloat(e.target.value); if(!isNaN(v)){ r.size=v; save(); } };

    row.querySelector('.dr-label').onchange=e=>{ r.label=e.target.value; save(); };

    row.querySelector('.dr-nav').onchange=e=>{ r.navigable=e.target.checked; save(); };

  });

}

$('#drAdd')?.addEventListener('click',()=>{ drules.push({enabled:true,name:'New rule',categories:[],match:[],shape:'Circle',color:'#ffd926',opacity:1,size:4,_open:true}); renderDrules(); saveDrules(); });



/* тФАтФА Add-rule picker: browse the area's live ENTITIES + terrain TILE names, filter, click to seed a

   rule (entity тЖТ entity rule by category; tile тЖТ Tile rule). Removes the guesswork of typing metadata. тФАтФА */

let _pickEl=null, _pickEnts=[], _pickTiles=[], _pickKind='all', _pickQ='';

const lastSeg=s=>((s||'').split('/').pop()||'').replace(/@\d+$/,'').replace(/\.tdt$/i,'');

function ensurePick(){

  if(_pickEl) return _pickEl;

  _pickEl=document.createElement('div'); _pickEl.id='pickPop';

  _pickEl.innerHTML=`<div class="pickbox">

    <div class="pickhead">

      <input id="pickSearch" type="search" placeholder="filter by name / metadata / tile pathтАж">

      <span class="pickkinds"><button class="chip on" data-k="all">All</button><button class="chip" data-k="entity">Entities</button><button class="chip" data-k="tile">Tiles</button></span>

      <button class="pickclose" title="close">тЬХ</button>

    </div>

    <div class="picklist" id="pickList"></div>

    <div class="pickfoot">Click a target to add a rule for it (opens expanded to refine). Entities seed an entity rule; tiles seed a Tile rule.</div>

  </div>`;

  document.body.appendChild(_pickEl);

  _pickEl.querySelector('.pickclose').onclick=()=>_pickEl.classList.remove('open');

  _pickEl.onclick=e=>{ if(e.target===_pickEl) _pickEl.classList.remove('open'); };

  _pickEl.querySelector('#pickSearch').oninput=e=>{ _pickQ=e.target.value.toLowerCase(); renderPick(); };

  _pickEl.querySelectorAll('.pickkinds .chip').forEach(c=>c.onclick=()=>{ _pickKind=c.dataset.k; _pickEl.querySelectorAll('.pickkinds .chip').forEach(x=>x.classList.toggle('on',x===c)); renderPick(); });

  return _pickEl;

}

async function openPicker(){

  const pop=ensurePick(); pop.classList.add('open');

  _pickQ=''; _pickKind='all';

  pop.querySelector('#pickSearch').value=''; pop.querySelectorAll('.pickkinds .chip').forEach((x,j)=>x.classList.toggle('on',j===0));

  $('#pickList').innerHTML='<div class="pickempty">LoadingтАж</div>';

  try{ _pickEnts=await getJSON('/entities?limit=1000')||[]; }catch(_){ _pickEnts=[]; }

  try{ const t=await getJSON('/api/tiles'); _pickTiles=(t&&t.tiles)||[]; }catch(_){ _pickTiles=[]; }

  renderPick(); pop.querySelector('#pickSearch').focus();

}

function pickItems(){

  const q=_pickQ, out=[];

  if(_pickKind!=='tile'){

    const seen=new Set();

    _pickEnts.forEach(e=>{ const k=e.category+'|'+e.metadata; if(seen.has(k))return; seen.add(k);

      if(q && !((e.metadata||'').toLowerCase().includes(q)||(e.name||'').toLowerCase().includes(q)||(e.category||'').toLowerCase().includes(q)))return;

      out.push({kind:'entity',cat:e.category,name:e.name||lastSeg(e.metadata),sub:e.metadata,rarity:e.rarity}); });

  }

  if(_pickKind!=='entity'){

    _pickTiles.forEach(p=>{ if(q && !p.toLowerCase().includes(q))return; out.push({kind:'tile',cat:'Tile',name:lastSeg(p),sub:p}); });

  }

  return out;

}

function renderPick(){

  const items=pickItems(), list=$('#pickList');

  list.innerHTML = items.length ? items.slice(0,600).map((it,i)=>

    `<div class="pickrow" data-i="${i}"><span class="pickbadge ${it.kind}">${it.kind==='tile'?'TILE':esc(it.cat)}</span>`

    +`<span class="picknm">${esc(it.name)}</span><span class="picksub">${esc(it.sub)}</span>`

    +(it.rarity&&it.rarity!=='NonMonster'?`<span class="pickrar">${esc(it.rarity)}</span>`:'')+`</div>`).join('')

    : `<div class="pickempty">No matches${(_pickEnts.length+_pickTiles.length===0)?' тАФ are you in game?':''}.</div>`;

  $$('#pickList .pickrow').forEach(row=>row.onclick=()=>pickItem(items[+row.dataset.i]));

}

function pickItem(it){

  if(!it) return;

  const r = it.kind==='tile'

    ? {enabled:true,name:it.name,categories:['Tile'],match:[lastSeg(it.sub)],shape:'Diamond',color:'#f259f2',opacity:1,size:5,navigable:true,_open:true}

    : {enabled:true,name:it.name,categories:[it.cat],match:[lastSeg(it.sub)],shape:'Star',color:'#ffd926',opacity:1,size:6,_open:true};

  drules.unshift(r); renderDrules(); saveDrules();

  _pickEl.classList.remove('open');

  const first=$('#drList .drrow'); if(first) first.scrollIntoView({block:'center'});

}

$('#drPick')?.addEventListener('click',openPicker);

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



/* тФАтФА Landmarks tab: view/edit the curated map-label table (baked + user overlay) + import/export тФАтФА */

let lmEntries=[], lmAreaOnly=true, lmQ='';

function flashL(){ const m=$('#savedMsgL'); if(!m) return; m.classList.add('show'); clearTimeout(m._t); m._t=setTimeout(()=>m.classList.remove('show'),1100); }

async function loadLandmarks(){

  try{ const r=await getJSON('/api/landmarks'); lmEntries=r.entries||[]; }catch(e){ lmEntries=[]; }

  const a=$('#lmArea'); if(a && !a.value) a.value=(state&&state.areaCode)||'';

  renderLandmarks();

}

async function postLandmarks(body){

  try{ const r=await fetch('/api/landmarks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const j=await r.json(); if(j&&j.entries) lmEntries=j.entries; flashL(); }catch(e){}

  renderLandmarks();

}

function lmRow(e){

  const badge=e.suppressed?'hidden':e.source;

  const del=e.suppressed?'Restore':(e.source==='user'?'Remove':'Hide');

  return `<div class="lmrow${e.suppressed?' sup':''}" data-area="${esc(e.area)}" data-pat="${esc(e.pattern)}">

    <span class="lmbadge ${badge}">${badge}</span>

    <span class="lmarea">${esc(e.area)}</span>

    <input class="mname lmlabel" value="${esc(e.label||'')}" placeholder="${e.suppressed?'(hidden)':'label'}">

    <span class="lmpath" title="${esc(e.pattern)}">${esc(e.pattern)}</span>

    <button class="delbtn lm-del">${del}</button>

  </div>`;

}

function renderLandmarks(){

  const host=$('#lmList'); if(!host) return;

  const area=(state&&state.areaCode)||'';

  const rows=lmEntries.filter(e=>{

    if(lmAreaOnly && e.area!=='*' && e.area!==area) return false;

    if(lmQ){ if(!((e.area+' '+e.pattern+' '+(e.label||'')).toLowerCase().includes(lmQ))) return false; }

    return true;

  });

  host.innerHTML = rows.length ? rows.map(lmRow).join('')

    : `<div class="row"><div class="rl hint-row">No curated landmarks${lmAreaOnly?' for this area ('+esc(area||'тАФ')+')':''}. Add one below${lmAreaOnly?', or turn off &ldquo;This area only&rdquo;':''}.</div></div>`;

  $$('#lmList .lmrow').forEach(row=>{

    const area=row.dataset.area, pat=row.dataset.pat, e=lmEntries.find(x=>x.area===area&&x.pattern===pat); if(!e) return;

    row.querySelector('.lmlabel').onchange=ev=>postLandmarks({set:{area,pattern:pat,label:ev.target.value}});

    row.querySelector('.lm-del').onclick=()=>{

      if(e.suppressed || e.source==='user') postLandmarks({remove:{area,pattern:pat}}); // restore baked / delete user

      else postLandmarks({set:{area,pattern:pat,label:null}});                          // suppress a baked entry

    };

  });

}

$('#lmSearch')?.addEventListener('input',e=>{ lmQ=e.target.value.toLowerCase(); renderLandmarks(); });

$('#lmAreaOnly')?.addEventListener('click',()=>{ lmAreaOnly=!lmAreaOnly; $('#lmAreaOnly').classList.toggle('on',lmAreaOnly); renderLandmarks(); });

$('#lmAdd')?.addEventListener('click',()=>{

  const area=($('#lmArea').value||'').trim(), pat=($('#lmPat').value||'').trim(), label=($('#lmLabel').value||'').trim();

  if(!area||!pat||!label) return;

  $('#lmPat').value=''; $('#lmLabel').value='';

  postLandmarks({set:{area,pattern:pat,label}});

});

$('#lmExport')?.addEventListener('click',async()=>{

  try{ const txt=await (await fetch('/api/landmarks?export=1',{cache:'no-store'})).text();

    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));

    a.download='CustomLandmarks.json'; a.click(); URL.revokeObjectURL(a.href);

  }catch(e){}

});

$('#lmImport')?.addEventListener('click',()=>{

  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';

  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return; const rd=new FileReader();

    rd.onload=()=>{ try{ postLandmarks({import:JSON.parse(rd.result)}); }catch(_){ alert('Invalid JSON file'); } };

    rd.readAsText(f); };

  inp.click();

});



/* тФАтФА atlas tab (read-only inspection of the map-data we can read) тФАтФА */

async function loadAtlas(){

  $('#atlasStatus').textContent='readingтАж';

  try{ atlasData=await getJSON('/api/atlas'); }catch(e){ atlasData={located:false,note:'request failed'}; }

  renderAtlas();

}

function renderAtlas(){

  const d=atlasData; if(!d){ return; }

  const st=$('#atlasStatus'); const nd=d.nodes;

  if(!(nd&&nd.total)) st.textContent = d.note ? 'scanningтАж' : 'atlas closed тАФ open it in-game + Refresh';

  else st.textContent = nd.total+' nodes ┬╖ '+nd.hasContent+' with content ┬╖ '

        +(d.allTags?.length||0)+' content / '+(d.allMaps?.length||0)+' map filters';

  // Seed active rules from the overlay (once): tracked + arrow sets. Then render the filter table.

  if(atlasHl===null){ atlasHl=new Set((d.highlightTags||[]).map(t=>t.toLowerCase())); atlasArrow=new Set((d.arrowTags||[]).map(t=>t.toLowerCase())); }

  renderAtlasHighlight(d);

}

// Biome index тЖТ friendly-ish label (best-effort; index is the ground truth).

const BIOMES=['Grass','Sand','Swamp','Forest','Snow','Stone','Volcanic','Coast','Cave','Vaal','Water','Desert','Special'];

const biomeName=i=>(i>=0&&i<BIOMES.length)?BIOMES[i]:('biome '+i);



// Highlight-rule chips: one per distinct content tag on the atlas. Click to toggle тЖТ ONLY matching maps

// are drawn in-game. Active set is pushed to the overlay (persisted there).

// Classify a filter row into a category for the table (and grouping/colour).

function catContent(t){ const s=t.toLowerCase(); if(/not shown|\[dnt\]/.test(s))return'Hidden'; if(/boss/.test(s))return'Boss'; if(/influence/.test(s))return'Influence'; return'Mechanic'; }

function catMap(t){ const s=t.toLowerCase(); if(/citadel/.test(s))return'Citadel'; if(/tower/.test(s))return'Tower'; if(/temple/.test(s))return'Temple'; if(/vaal/.test(s))return'Vaal'; return'Map'; }

// Per-category colour (badge tint).

const CATCOL={Boss:'#e0533a',Mechanic:'#3ca0ff',Influence:'#a06cff',Hidden:'#ff5db1',Citadel:'#e0b341',Tower:'#2fb6a8',Temple:'#d98a2b',Vaal:'#c0395a',Map:'#8a93a0'};

function catBadge(cat){ const c=CATCOL[cat]||'#8a93a0'; return '<span style="display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:600;background:'+c+'26;color:'+c+';border:1px solid '+c+'66">'+esc(cat)+'</span>'; }

// Build the unified filter list (content + map) with {title,count,cat,group}.

function atlasFilterRows(d){

  const rows=[];

  (d.allTags||[]).forEach(t=>rows.push({title:t.tag,count:t.count,group:'Content',cat:catContent(t.tag)}));

  (d.allMaps||[]).forEach(t=>rows.push({title:t.tag,count:t.count,group:'Map',cat:catMap(t.tag)}));

  return rows;

}

let atlasHlSort={key:'count',dir:-1};

function renderAtlasHighlight(d){

  const box=$('#atlasHlTable'); if(!box) return;

  let rows=atlasFilterRows(d);

  if(rows.length===0){ box.innerHTML='<span class="hint-row" style="padding:8px;display:block">No filters yet (open the Atlas + Refresh).</span>'; updateHlCount(); return; }

  const flt=($('#atlasHlFilter')?.value||'').trim().toLowerCase();

  if(flt) rows=rows.filter(r=>r.title.toLowerCase().includes(flt)||r.cat.toLowerCase().includes(flt)||r.group.toLowerCase().includes(flt));

  if(atlasHlSelOnly) rows=rows.filter(r=>atlasHl.has(r.title.toLowerCase())||atlasArrow.has(r.title.toLowerCase()));

  const k=atlasHlSort.key, dir=atlasHlSort.dir;

  rows.sort((a,b)=>{ let v= k==='count' ? a.count-b.count : (''+a[k]).localeCompare(''+b[k]); return v*dir || a.title.localeCompare(b.title); });

  const sa=key=> atlasHlSort.key===key ? (atlasHlSort.dir<0?' тЦ╝':' тЦ▓') : '';

  const cell='display:grid;grid-template-columns:30px 34px 1fr 50px 90px;gap:8px;align-items:center;padding:5px 9px';

  let html='<div style="'+cell+';position:sticky;top:0;background:var(--panel,#1a1a1a);border-bottom:1px solid var(--line);font-weight:600;font-size:11px;text-transform:uppercase;opacity:.75">'

    +'<span title="Track: ring the map in-game">&#9745;</span>'

    +'<span title="Arrow: edge arrow toward it when off-screen">&#10148;</span>'

    +'<span data-sort="title" style="cursor:pointer">Title'+sa('title')+'</span>'

    +'<span data-sort="count" style="cursor:pointer;text-align:right">Count'+sa('count')+'</span>'

    +'<span data-sort="cat" style="cursor:pointer">Category'+sa('cat')+'</span></div>';

  html+=rows.map(r=>{

    const key=r.title.toLowerCase(); const trk=atlasHl.has(key), arw=atlasArrow.has(key);

    return '<div class="hlrow" data-tag="'+esc(r.title)+'" style="'+cell+';cursor:pointer;border-bottom:1px solid var(--line)'+((trk||arw)?';background:rgba(60,160,255,.14)':'')+'">'

      +'<span style="font-size:15px">'+(trk?'тШС':'тШР')+'</span>'

      +'<span class="hlarw" data-tag="'+esc(r.title)+'" title="toggle off-screen arrow" style="font-size:15px;cursor:pointer;color:'+(arw?'#e0b341':'#4a525c')+'">тЮд</span>'

      +'<span title="'+esc(r.title)+'">'+esc(r.title)+'</span>'

      +'<span class="amono" style="text-align:right">'+r.count+'</span>'

      +'<span>'+catBadge(r.cat)+'</span></div>';

  }).join('');

  box.innerHTML=html;

  $$('#atlasHlTable [data-sort]').forEach(h=>h.onclick=()=>{ const key=h.dataset.sort; if(atlasHlSort.key===key) atlasHlSort.dir*=-1; else atlasHlSort={key,dir:key==='count'?-1:1}; renderAtlasHighlight(d); });

  $$('#atlasHlTable .hlarw[data-tag]').forEach(a=>a.onclick=e=>{

    e.stopPropagation(); const key=a.dataset.tag.toLowerCase();

    if(atlasArrow.has(key)) atlasArrow.delete(key); else atlasArrow.add(key);

    renderAtlasHighlight(d); postAtlasHighlight();

  });

  $$('#atlasHlTable .hlrow[data-tag]').forEach(row=>row.onclick=()=>{

    const key=row.dataset.tag.toLowerCase();

    if(atlasHl.has(key)) atlasHl.delete(key); else atlasHl.add(key);

    renderAtlasHighlight(d); postAtlasHighlight();

  });

  updateHlCount();

}

function updateHlCount(){ const el=$('#atlasHlCount'); if(el) el.textContent=(atlasHl?atlasHl.size:0)+' tracked ┬╖ '+(atlasArrow?atlasArrow.size:0)+' arrow'; }

// Push the active highlight tags (original-case, from allTags) to the overlay.

async function postAtlasHighlight(){

  // Build {tag,color,track,arrow} rules: colour = the row's category colour, so in-game rings match the table.

  const rows=atlasData?atlasFilterRows(atlasData):[];

  const rules=rows.filter(r=>{const k=r.title.toLowerCase(); return atlasHl.has(k)||atlasArrow.has(k);})

    .map(r=>{const k=r.title.toLowerCase(); return {tag:r.title, color:(CATCOL[r.cat]||'#3ca0ff'), track:atlasHl.has(k), arrow:atlasArrow.has(k)};});

  try{ await fetch('/api/atlas-highlight',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules})}); }catch(e){}

}

$('#atlasHlClear')?.addEventListener('click',()=>{ atlasHl.clear(); atlasArrow.clear(); if(atlasData) renderAtlasHighlight(atlasData); postAtlasHighlight(); });

$('#atlasHlFilter')?.addEventListener('input',()=>{ if(atlasData) renderAtlasHighlight(atlasData); });

$('#atlasHlSelOnly')?.addEventListener('click',e=>{ atlasHlSelOnly=!atlasHlSelOnly; e.target.classList.toggle('on',atlasHlSelOnly); if(atlasData) renderAtlasHighlight(atlasData); });



// Live-nodes grid: each row is a real atlas node. Click a row to SELECT it тЖТ the overlay highlights

// it in-game (projection calibration loop). Selection is the set of element addresses.

function renderAtlasNodes(d, f){

  let list=d.nodeList||[];

  if(f) list=list.filter(n=> (''+n.id).includes(f) || biomeName(n.biome).toLowerCase().includes(f)

      || (n.map||'').toLowerCase().includes(f) || (n.hasContent&&'content'.includes(f))

      || (!n.visited&&'unvisited'.includes(f)) || ('biome '+n.biome).includes(f)

      || (n.tags||[]).some(t=>t.toLowerCase().includes(f)));   // match on map name + content names

  if(list.length===0){ $('#atlasList').innerHTML='<div class="hint-row">No live nodes (open the Atlas in-game, then Refresh).</div>'; return; }

  // Content nodes first (the interesting ones), then by tag count.

  list=list.slice().sort((a,b)=>((b.tags||[]).length)-((a.tags||[]).length));

  const head='<div class="arow ahead nrow"><span>Map</span><span>Content</span><span>Biome</span><span>Pos</span></div>';

  const body=list.slice(0,1200).map(n=>{

    const sel=atlasSel.has(n.el)?' sel':'';

    const hot=((n.map&&atlasHl.has(n.map.toLowerCase()))||(n.tags||[]).some(t=>atlasHl.has(t.toLowerCase())));

    const val=(n.tags&&n.tags.length)?' val':'';

    const content=(n.tags||[]).map(t=>'<span class="ntag tc">'+esc(t)+'</span>').join(' ')||'<span class="hint-row">тАФ</span>';

    return '<div class="arow nrow'+val+sel+(hot?' sel':'')+'" data-el="'+esc(n.el)+'">'

      +'<span title="'+esc(n.map||'')+'">'+esc(n.map||'тАФ')+(n.visited?' <span class="ntag tv">тЬУ</span>':'')+'</span>'

      +'<span>'+content+'</span><span>'+esc(biomeName(n.biome))+'</span>'

      +'<span class="amono">('+n.x+','+n.y+')</span></div>';

  }).join('');

  $('#atlasList').innerHTML=head+body

    +'<div class="hint-row" style="margin-top:10px"><b>Click a node row to highlight it in-game</b> (drives the overlayтАЩs atlas highlight тАФ use it to confirm positions / calibrate). Click again to deselect. Showing '+Math.min(list.length,1200)+' of '+list.length+' nodes.</div>';

  $$('#atlasList .nrow[data-el]').forEach(row=>row.onclick=()=>{

    const el=row.dataset.el;

    if(atlasSel.has(el)) atlasSel.delete(el); else atlasSel.add(el);

    row.classList.toggle('sel',atlasSel.has(el));

    postAtlasSel();

  });

}

async function postAtlasSel(){ try{ await fetch('/api/atlas-select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({els:[...atlasSel]})}); }catch(e){} }



$('#atlasRefresh')?.addEventListener('click',loadAtlas);

$('#atlasSearch')?.addEventListener('input',()=>{ if(atlasData) renderAtlas(); });

$$('#atlasViewCatalog,#atlasViewRegion,#atlasViewNodes').forEach(b=>b?.addEventListener('click',()=>{

  atlasView=b.dataset.view;

  $$('#atlasViewCatalog,#atlasViewRegion,#atlasViewNodes').forEach(x=>x.classList.toggle('on',x===b));

  renderAtlas();

}));



/* тФАтФА left rail тФАтФА */

function renderState(){

  const s=state; if(!s) return;

  const hp=Math.max(0,Math.min(100,s.hpPct||0)), mp=Math.max(0,Math.min(100,s.manaPct||0)), es=Math.max(0,Math.min(100,s.esPct||0));

  $('#hpBar').style.width=hp+'%'; $('#mpBar').style.width=mp+'%'; $('#esBar').style.width=es+'%';

  $('#hpNum').textContent=hp.toFixed(0)+'%'; $('#mpNum').textContent=mp.toFixed(0)+'%'; $('#esNum').textContent=es.toFixed(0)+'%';

  const areaName=(s.areaName&&s.areaName!==s.areaCode)?s.areaName:'';

  $('#kAreaName').textContent=areaName||s.areaCode||'тАФ';

  $('#kArea').textContent=s.areaCode||'тАФ';

  const act=s.areaAct||0;

  $('#kAlvl').textContent=(act?'Act '+act+' ┬╖ ':'')+(s.areaLevel?('lvl '+s.areaLevel):'тАФ');

  $('#kMap').textContent=s.mapVisible?'yes':'no';

  $('#kFlask').textContent=(s.autoFlask?'on':'off')+(s.flask?' ┬╖ '+s.flask:'');

  const fs=$('#flaskState'); if(fs) fs.textContent=(s.autoFlask?'ON':'OFF')+(s.flask?' ┬╖ '+s.flask:'');

  $('#cEnt').textContent=s.entityCount||0;

  $('#cPoi').textContent=s.poiCount||0;

  $('#cMon').textContent=(s.counts&&s.counts.Monster)||0;

  $('#cLm').textContent=s.landmarkCount||0;

  $('#areaChip').innerHTML = (areaName||s.areaCode||'тАФ') + ' <b>┬╖</b> ' + (s.inGame?'in game':'town/menu');



  // Zone leveling notes (from /api/zone): title + note text, hidden when there's nothing to show.

  const zn=$('#zoneNotes');

  if(zone && (zone.notes||'').trim()){

    zn.hidden=false;

    zn.innerHTML='<div class="zt">'+esc(zone.title||zone.name||'')+'</div>'+esc(zone.notes);

  } else { zn.hidden=true; }

}



// Update banner: show a download link if a newer version exists on GitHub (best-effort).

async function checkVersion(){

  try{

    const v=await getJSON('/api/version');

    if(v && v.updateAvailable){

      const b=$('#updateBanner'); if(!b) return;

      const m=$('#updateMsg'); if(m) m.textContent=' тАФ '+(v.latest||'')+' (you have v'+(v.current||'?')+')';

      b.href=v.url||'#'; b.hidden=false; b.style.display='flex';

    }

  }catch(e){}

}



wireSettings(); wireHpBars(); wireTerrain();

loadIcons().then(()=>{ loadSettings(); loadFilters(); }); // Rules is the default tab

tick(); setInterval(tick, 1000);

checkVersion();