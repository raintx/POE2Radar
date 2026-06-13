// -- i18n and init --
const dict = {
  pt: {"tabRules": "Regras", "rulesTitle": "Regras de Exibição", "rulesSub": "um único conjunto ordenado — a primeira regra que combinar vence", "rulesHint": "A fonte da verdade para como cada entidade é desenhada. Cada entidade é avaliada de <b>cima para baixo</b>; a <b>primeira regra ativa que combinar</b> decide tudo — ícone, cor, se oculta, se exibe HP, e se auto-roteia. Reordene com ▲/▼. Uma regra combina com <i>tipo, termos de metadata, mods de monstro, raridade, reação, etc.</i> Uma condição vazia significa 'qualquer'. Se duas regras combinarem, a mais alta vence.", "atlasTitle": "Destaques do Atlas", "atlasSub": "apenas mapas destacados são exibidos no jogo", "atlasHint": "Lê a memória de cada mapa do Atlas + <b>conteúdo rolado</b> (Chefe Poderoso, Breach, Delirium, conteúdos ocultos...). <b>Marque os filtros abaixo para circular esses mapas no jogo</b> — apenas os mapas marcados serão desenhados, então você pode ver o que o jogo esconde. Abra o Atlas no jogo e clique em Atualizar.", "lmSubNew": "rótulos curados do mapa — ver, fixar, compartilhar", "lmHintNew": "Os locais notáveis padrão do mapa (chefes, saídas, loot, waypoints...), rotulados por área. Renomeie um errado, adicione o seu, ou oculte. <b>Exportar</b> para compartilhar uma lista; <b>Importar</b> para carregar uma. (Para mudar a <i>aparência</i> do tile, crie uma Regra na aba Regras).", "flaskLifeTrig": "Gatilho de poção (Vida)", "flaskLifeTrigDesc": "qual status a tecla de poção de vida observa — ES é ignorado se você não tiver.", "flaskHealthPct": "Vida %", "flaskEsPct": "Escudo (ES) %", "flaskEitherPct": "Ambos (Vida ou ES)", "hideHintNew": "Um corte mais agressivo que uma regra Ocultar: entidades cujo metadata contenham o padrão são removidas <i>de todo o radar</i> — overlay, lista de entidades e navegação — antes mesmo das Regras rodarem.", "hideSubNew": "ocultar totalmente do radar, lista e nav", "refreshAtlasBtn": "Atualizar Atlas", "exportBtn": "Exportar", "importBtn": "Importar...", "life": "Vida", "mana": "Mana", "shield": "Escudo", "zone": "Zona", "area": "Área", "areaCode": "Cód. Área", "areaLvl": "Ato / Nível da Área", "activeTime": "Tempo Ativo", "mapOpen": "Mapa aberto", "autoFlask": "Auto-poção", "streamerMode": "Modo Streamer", "streamerDesc": "Ocultar o nome e o level do seu personagem do radar para privacidade.", "language": "Idioma", "langDesc": "Escolha o idioma do painel.", "you": "Você", "hidden": "Oculto", "act": "Ato", "areaLvlNum": "Área Lvl", "yes": "sim", "no": "não", "on": "ligado", "off": "desligado", "inGame": "no jogo", "menu": "cidade/menu", "cEnt": "Entidades", "cPoi": "Pontos de Int.", "cMon": "Monstros", "cLm": "Pontos Ref.", "tabDash": "Painel", "tabSettings": "Configurações", "navSearchPh": "buscar entidades, pontos, tiles…", "navAlive": "Apenas vivos", "navClear": "Limpar rotas", "kindAll": "Todos", "kindLmt": "Pontos Ref. & Terreno", "kindEnt": "Entidades", "navEmpty": "Nada para navegar aqui.", "hideTitle": "Ocultos", "lmTitle": "Tiles de Pontos Ref.", "savedMsg": "✓ salvo nas configurações", "dispRadar": "Exibição do Radar", "showMon": "Mostrar monstros", "showMonDesc": "pontos inimigos no mapa", "showTerr": "Mostrar terreno", "showTerrDesc": "mapa de terreno andável", "showPl": "Mostrar jogador", "showPlDesc": "ponto azul marcando sua posição", "showPath": "Rotas de navegação", "showPathDesc": "desenhar rotas A* até os pontos", "fpsCap": "Limite FPS (Overlay)", "fpsCapDesc": "menor = menos carga; 60 é fluido", "hpTitle": "Barras HP Monstros", "hpSub": "por raridade", "hpRarity": "Raridade", "hpShow": "Mostrar", "hpWidth": "Larg.", "hpBorder": "Borda", "hpThick": "Esp.", "hpNorm": "Normal", "hpMag": "Mágico", "hpRare": "Raro", "hpUni": "Único", "hpHeight": "Altura", "hpOffX": "Offset X", "hpOffY": "Offset Y", "hpHintNew": "Preenchimento segue a cor do ícone; defina cor da borda e espessura por raridade (0 = sem borda). Y negativo = acima do mob.", "terrTitle": "Terreno", "terrSub": "overlay andável", "terrInt": "Preenchimento", "terrIntDesc": "cor sobre as células andáveis", "terrEdge": "Borda da parede", "terrEdgeDesc": "contornos em volta das salas", "calTitle": "Calibração do Mapa", "calScale": "Multiplicador de escala", "calScaleDesc": "escala da projeção", "calOffX": "Offset X", "calOffY": "Offset Y", "flaskTitle": "Auto-Poção", "flaskLife": "Limite Vida %", "flaskLifeDesc": "usar poção abaixo dessa %", "flaskMana": "Limite Mana %", "flaskLifeKey": "Tecla Poção Vida", "flaskManaKey": "Tecla Poção Mana", "flaskLifeCd": "Cooldown Vida", "flaskManaCd": "Cooldown Mana", "flaskManaCdDesc": "ms mínimo entre poções", "iconTitle": "Ícones do Radar", "iconSub": "forma · cor · opacidade · tamanho", "censo": "Censo"},
  en: {"tabRules": "Rules", "rulesTitle": "Display Rules", "rulesSub": "one ordered ruleset — first match wins", "rulesHint": "The single source of truth for how every entity draws. Each entity is matched <b>top–to–bottom</b>; the <b>first enabled rule that matches</b> decides everything — its icon &amp; color, whether it’s hidden, whether it shows an HP bar, and whether it’s auto-pathed. Reorder with ▲/▼ to change precedence. A rule matches on any mix of <i>type, metadata terms, monster mods (auras/buffs), rarity, reaction, life, chest/POI/encounter state</i>; a blank condition means “any”. No more conflicting filters — if two rules could match, the higher one wins.", "atlasTitle": "Atlas highlights", "atlasSub": "only highlighted maps draw in-game", "atlasHint": "Each atlas tile's map + <b>rolled content</b> (Powerful Map Boss, Breach, Delirium, hidden content…) read from memory. <b>Check filters below to ring those maps in-game</b> — only highlighted maps are drawn, so you can spot content the game hides by default. Open the Atlas in-game, then Refresh.", "lmSubNew": "curated map labels — view, fix, share", "lmHintNew": "The built-in “known” map features (boss arenas, exits, loot, waypoints…), labelled per area. Rename a wrong label, add your own, or hide a bad entry. <b>Export</b> a corrected list to share or submit for baking into a release; <b>Import</b> to load one. (For how a tile <i>draws</i> — icon/color/hide — use a Tile rule on the Rules tab; this is just the labels.)", "flaskLifeTrig": "Life flask triggers on", "flaskLifeTrigDesc": "which pool the life flask key watches — ES is ignored if your build has none", "flaskHealthPct": "Health %", "flaskEsPct": "Energy Shield %", "flaskEitherPct": "Either (HP or ES)", "hideHintNew": "A stronger cut than a Hide rule: entities whose metadata contains a pattern (or matches a <code>*</code>/<code>?</code> glob) are removed <i>everywhere</i> — overlay, entity list, and navigation — before the display rules even run.", "hideSubNew": "cull entirely from radar, list &amp; nav", "refreshAtlasBtn": "Refresh Atlas", "exportBtn": "Export", "importBtn": "Import...", "life": "Life", "mana": "Mana", "shield": "Shield", "zone": "Zone", "area": "Area", "areaCode": "Area Code", "areaLvl": "Act / Area Level", "activeTime": "Active Time", "mapOpen": "Map Open", "autoFlask": "Auto-Flask", "streamerMode": "Streamer Mode", "streamerDesc": "Hide your character name and level from the radar for privacy.", "language": "Language", "langDesc": "Choose the dashboard language.", "you": "You", "hidden": "Hidden", "act": "Act", "areaLvlNum": "Area Lvl", "yes": "yes", "no": "no", "on": "on", "off": "off", "inGame": "in game", "menu": "town/menu", "cEnt": "Entities", "cPoi": "Points of Int.", "cMon": "Monsters", "cLm": "Landmarks", "tabDash": "Dashboard", "tabSettings": "Settings", "navSearchPh": "search entities, points, tiles…", "navAlive": "Alive only", "navClear": "Clear paths", "kindAll": "All", "kindLmt": "Landmarks & Terrain", "kindEnt": "Entities", "navEmpty": "Nothing to navigate here.", "hideTitle": "Hidden", "lmTitle": "Landmark tiles", "savedMsg": "✓ saved to config", "dispRadar": "Radar Display", "showMon": "Show monsters", "showMonDesc": "enemy dots on the map", "showTerr": "Show terrain", "showTerrDesc": "walkable terrain map", "showPl": "Show player", "showPlDesc": "blue dot marking your position", "showPath": "Navigation paths", "showPathDesc": "draw A* paths to targets", "fpsCap": "FPS Cap (Overlay)", "fpsCapDesc": "lower = less load; 60 is fluid", "hpTitle": "Monster HP Bars", "hpSub": "by rarity", "hpRarity": "Rarity", "hpShow": "Show", "hpWidth": "Width", "hpBorder": "Border", "hpThick": "Thick.", "hpNorm": "Normal", "hpMag": "Magic", "hpRare": "Rare", "hpUni": "Unique", "hpHeight": "Height", "hpOffX": "Offset X", "hpOffY": "Offset Y", "hpHintNew": "Bar fill follows the monster icon color; set border color & thickness per rarity (thickness 0 = no border). Offset Y negative = above the mob.", "terrTitle": "Terrain", "terrSub": "walkable overlay", "terrInt": "Interior fill", "terrIntDesc": "wash over walkable cells", "terrEdge": "Wall edge", "terrEdgeDesc": "outlines around rooms", "calTitle": "Map Calibration", "calScale": "Scale multiplier", "calScaleDesc": "projection scale of the map overlay", "calOffX": "Offset X", "calOffY": "Offset Y", "flaskTitle": "Auto-Flask", "flaskLife": "Life Threshold %", "flaskLifeDesc": "use flask below this %", "flaskMana": "Mana Threshold %", "flaskLifeKey": "Life Flask Key", "flaskManaKey": "Mana Flask Key", "flaskLifeCd": "Life Cooldown", "flaskManaCd": "Mana Cooldown", "flaskManaCdDesc": "min ms between flasks", "iconTitle": "Radar Icons", "iconSub": "shape · color · opacity · size", "censo": "Census"}
};
let i18n = dict.pt;

function applyTranslations() {
  const saved = localStorage.getItem('langPref') || 'auto';
  if (saved === 'auto') {
    $('#setLang').value = 'auto';
    const lang = navigator.language.startsWith('pt') ? 'pt' : 'en';
    i18n = dict[lang];
  } else {
    $('#setLang').value = saved;
    i18n = dict[saved] || dict.en;
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[key]) {
      // Use childNodes to replace text but preserve tags like <small>
      let replaced = false;
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && node.nodeValue.trim() !== '') {
          node.nodeValue = i18n[key];
          replaced = true;
          break;
        }
      }
      if(!replaced) el.innerHTML = el.innerHTML.replace(/^[^<]+/, i18n[key]);
    }
  });
  
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (i18n[key]) el.placeholder = i18n[key];
  });
}

const sm = document.getElementById('setStreamer');
if(sm) {
  sm.checked = localStorage.getItem('streamerMode') === '1';
  sm.onchange = (e) => {
    localStorage.setItem('streamerMode', e.target.checked ? '1' : '0');
    renderState();
  };
}

const langSel = document.getElementById('setLang');
if(langSel) {
  langSel.onchange = (e) => {
    localStorage.setItem('langPref', e.target.value);
    applyTranslations();
    renderState();
  };
}

applyTranslations();