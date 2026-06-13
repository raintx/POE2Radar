// -- i18n and init --
const dict = {
  pt: {"life": "Vida", "mana": "Mana", "shield": "Escudo", "zone": "Zona", "area": "Área", "areaCode": "Cód. Área", "areaLvl": "Ato / Nível da Área", "activeTime": "Tempo Ativo", "mapOpen": "Mapa aberto", "autoFlask": "Auto-poção", "streamerMode": "Modo Streamer", "streamerDesc": "Ocultar o nome e o level do seu personagem do radar para privacidade.", "language": "Idioma", "langDesc": "Escolha o idioma do painel.", "you": "Você", "hidden": "Oculto", "act": "Ato", "areaLvlNum": "Área Lvl", "yes": "sim", "no": "não", "on": "ligado", "off": "desligado", "inGame": "no jogo", "menu": "cidade/menu", "cEnt": "Entidades", "cPoi": "Pontos de Int.", "cMon": "Monstros", "cLm": "Pontos Ref.", "tabDash": "Painel", "tabFilters": "Filtros", "tabSettings": "Configurações", "navSearchPh": "buscar entidades, pontos, tiles…", "navAlive": "Apenas vivos", "navClear": "Limpar rotas", "kindAll": "Todos", "kindLmt": "Pontos Ref. & Terreno", "kindEnt": "Entidades", "navEmpty": "Nada para navegar aqui.", "watchTitle": "Observados", "watchSub": "destacar + nomear pelo metadata", "watchHint": "Entidades cujo metadata contém um padrão são forçadas a desenhar com essa cor/forma/tamanho com o rótulo ao lado — mesmo se a categoria for normalmente ocultada. O primeiro que combinar vence.", "btnAdd": "+ Adicionar", "btnHide": "+ Ocultar", "hideTitle": "Ocultos", "hideSub": "remover do radar, lista & navegação", "hideHint": "Entidades cujo metadata contém um padrão (ou globs */?) são removidas de todo lugar — overlay, lista de entidades e navegação.", "autoNavTitle": "Padrões Auto-rota", "autoNavSub": "auto-selecionar alvos de navegação na entrada da zona", "autoNavHint": "Ao entrar numa zona, todo alvo de navegação cujo caminho da tile / metadata da entidade contém um destes é auto-selecionado para desenhar a rota (até 8). Limpe tudo para desativar.", "suggText": "Sugestões — clique para adicionar:", "lmTitle": "Tiles de Pontos Ref.", "lmSub": "mostrar tiles de terreno como marcadores (visíveis em qualquer lugar)", "lmHint": "Tiles de terreno cujo caminho contém um padrão são exibidos como pontos de referência — visíveis independentemente de onde você esteja no mapa. O rótulo opcional os renomeia; em branco usa o próprio nome da tile.", "savedMsg": "✓ salvo nas configurações", "dispRadar": "Exibição do Radar", "showMon": "Mostrar monstros", "showMonDesc": "pontos inimigos no mapa", "showTerr": "Mostrar terreno", "showTerrDesc": "mapa de terreno andável", "showPl": "Mostrar jogador", "showPlDesc": "ponto azul marcando sua posição", "showPath": "Rotas de navegação", "showPathDesc": "desenhar rotas A* até os pontos", "useCurLm": "Pontos Curados", "useCurLmDesc": "nomes da comunidade (chefe / saídas)", "fpsCap": "Limite FPS (Overlay)", "fpsCapDesc": "menor = menos carga; 60 é fluido", "hpTitle": "Barras HP Monstros", "hpSub": "por raridade", "hpRarity": "Raridade", "hpShow": "Mostrar", "hpWidth": "Larg.", "hpBorder": "Borda", "hpThick": "Esp.", "hpNorm": "Normal", "hpMag": "Mágico", "hpRare": "Raro", "hpUni": "Único", "hpHeight": "Altura", "hpOffX": "Offset X", "hpOffY": "Offset Y", "hpHint": "Preenchimento segue a cor do ícone; defina cor da borda e espessura por raridade (0 = sem borda). Y negativo = acima do mob.", "terrTitle": "Terreno", "terrSub": "overlay andável", "terrInt": "Preenchimento", "terrIntDesc": "cor sobre as células andáveis", "terrEdge": "Borda da parede", "terrEdgeDesc": "contornos em volta das salas", "terrHint": "Edições reconstroem o bitmap; use 'Mostrar terreno' acima para ocultar.", "calTitle": "Calibração do Mapa", "calScale": "Multiplicador de escala", "calScaleDesc": "escala da projeção", "calOffX": "Offset X", "calOffY": "Offset Y", "calHint": "Ajuste aqui — mudanças aplicam na hora (sem atalhos in-game).", "flaskTitle": "Auto-Poção", "flaskLife": "Limite Vida %", "flaskLifeDesc": "usar poção abaixo dessa %", "flaskMana": "Limite Mana %", "flaskManaDesc": "usar poção abaixo dessa %", "flaskLifeKey": "Tecla Poção Vida", "flaskManaKey": "Tecla Poção Mana", "flaskLifeCd": "Cooldown Vida", "flaskLifeCdDesc": "ms mínimo entre poções", "flaskManaCd": "Cooldown Mana", "flaskManaCdDesc": "ms mínimo entre poções", "flaskHint": "F8 alterna a auto-poção in-game. Status:", "iconTitle": "Ícones do Radar", "iconSub": "forma · cor · opacidade · tamanho", "mechTitle": "Mecânicas", "mechSub": "sobrescrever ícones por metadata", "mechHint": "Quando o metadata contém algum termo (sep. por vírgula) — e é de um dos tipos sel. — desenha este ícone em vez do padrão. Primeiro ativado vence.", "mechBtn": "+ Adicionar mecânica", "censo": "Censo", "watchPh": "padrão metadata (ex: Strongbox)", "labelPh": "rótulo (ex: Baú)", "hidePh": "padrão/glob para ocultar (ex: AbyssCrack, *Daemon*)", "autoNavPh": "padrão (ex: Waypoint)", "lmPh": "padrão do tile (ex: Vendor, Sanctum)", "lmlabelPh": "rótulo (opcional)"},
  en: {"life": "Life", "mana": "Mana", "shield": "Shield", "zone": "Zone", "area": "Area", "areaCode": "Area Code", "areaLvl": "Act / Area Level", "activeTime": "Active Time", "mapOpen": "Map Open", "autoFlask": "Auto-Flask", "streamerMode": "Streamer Mode", "streamerDesc": "Hide your character name and level from the radar for privacy.", "language": "Language", "langDesc": "Choose the dashboard language.", "you": "You", "hidden": "Hidden", "act": "Act", "areaLvlNum": "Area Lvl", "yes": "yes", "no": "no", "on": "on", "off": "off", "inGame": "in game", "menu": "town/menu", "cEnt": "Entities", "cPoi": "Points of Int.", "cMon": "Monsters", "cLm": "Landmarks", "tabDash": "Dashboard", "tabFilters": "Filters", "tabSettings": "Settings", "navSearchPh": "search entities, points, tiles…", "navAlive": "Alive only", "navClear": "Clear paths", "kindAll": "All", "kindLmt": "Landmarks & Terrain", "kindEnt": "Entities", "navEmpty": "Nothing to navigate here.", "watchTitle": "Watched", "watchSub": "highlight + label by metadata", "watchHint": "Entities whose metadata contains a pattern are force-drawn in this color/shape/size with the label shown next to them — even if their category is normally filtered. First enabled match wins.", "btnAdd": "+ Add", "btnHide": "+ Hide", "hideTitle": "Hidden", "hideSub": "cull from radar, list & nav", "hideHint": "Entities whose metadata contains a pattern (or matches a */? glob) are removed everywhere — overlay, entity list, and navigation.", "autoNavTitle": "Auto-path patterns", "autoNavSub": "auto-select nav targets on zone entry", "autoNavHint": "On entering a zone, every navigation target whose tile path / entity metadata contains one of these is auto-selected for path drawing (up to 8). Clear all to disable.", "suggText": "Suggestions — click to add:", "lmTitle": "Landmark tiles", "lmSub": "surface terrain tiles as map markers (shown anywhere)", "lmHint": "Terrain tiles whose path contains a pattern are surfaced as landmarks — visible regardless of where you are on the map (unlike entities, which only show in range). Optional label renames them; blank uses the tile's own name.", "savedMsg": "✓ saved to config", "dispRadar": "Radar Display", "showMon": "Show monsters", "showMonDesc": "enemy dots on the map", "showTerr": "Show terrain", "showTerrDesc": "walkable terrain map", "showPl": "Show player", "showPlDesc": "blue dot marking your position", "showPath": "Navigation paths", "showPathDesc": "draw A* paths to targets", "useCurLm": "Curated Landmarks", "useCurLmDesc": "community names (boss / exits)", "fpsCap": "FPS Cap (Overlay)", "fpsCapDesc": "lower = less load; 60 is fluid", "hpTitle": "Monster HP Bars", "hpSub": "by rarity", "hpRarity": "Rarity", "hpShow": "Show", "hpWidth": "Width", "hpBorder": "Border", "hpThick": "Thick.", "hpNorm": "Normal", "hpMag": "Magic", "hpRare": "Rare", "hpUni": "Unique", "hpHeight": "Height", "hpOffX": "Offset X", "hpOffY": "Offset Y", "hpHint": "Bar fill follows the monster icon color; set border color & thickness per rarity (thickness 0 = no border). Offset Y negative = above the mob.", "terrTitle": "Terrain", "terrSub": "walkable overlay", "terrInt": "Interior fill", "terrIntDesc": "wash over walkable cells", "terrEdge": "Wall edge", "terrEdgeDesc": "outlines around rooms", "terrHint": "Edits rebuild the terrain bitmap; use 'Show terrain' above to hide it entirely.", "calTitle": "Map Calibration", "calScale": "Scale multiplier", "calScaleDesc": "projection scale of the map overlay", "calOffX": "Offset X", "calOffY": "Offset Y", "calHint": "Adjust here — changes apply live (no in-game hotkeys).", "flaskTitle": "Auto-Flask", "flaskLife": "Life Threshold %", "flaskLifeDesc": "use flask below this %", "flaskMana": "Mana Threshold %", "flaskManaDesc": "use flask below this %", "flaskLifeKey": "Life Flask Key", "flaskManaKey": "Mana Flask Key", "flaskLifeCd": "Life Cooldown", "flaskLifeCdDesc": "min ms between flasks", "flaskManaCd": "Mana Cooldown", "flaskManaCdDesc": "min ms between flasks", "flaskHint": "F8 toggles auto-flask in-game. Status:", "iconTitle": "Radar Icons", "iconSub": "shape · color · opacity · size", "mechTitle": "Mechanics", "mechSub": "metadata-matched icon overrides", "mechHint": "When an entity's metadata contains any comma-separated match term — and it's one of the selected types — it draws this icon instead of its generic dot. First enabled match wins.", "mechBtn": "+ Add mechanic", "censo": "Census", "watchPh": "metadata pattern (e.g. Strongbox)", "labelPh": "label (e.g. Strongbox)", "hidePh": "pattern or glob to hide (e.g. AbyssCrack, *Daemon*)", "autoNavPh": "pattern (e.g. Waypoint)", "lmPh": "tile-path pattern (e.g. Vendor, Sanctum)", "lmlabelPh": "label (optional)"}
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