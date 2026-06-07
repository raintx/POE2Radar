import re

with open('f:\\RF\\Poe2\\src\\POE2Radar.Overlay\\Web\\DashboardHtml.cs', 'r', encoding='utf-8') as f:
    html = f.read()

translations = {
    "cEnt": {"pt": "Entidades", "en": "Entities"},
    "cPoi": {"pt": "Pontos de Int.", "en": "Points of Int."},
    "cMon": {"pt": "Monstros", "en": "Monsters"},
    "cLm": {"pt": "Pontos Ref.", "en": "Landmarks"},
    "tabDash": {"pt": "Painel", "en": "Dashboard"},
    "tabFilters": {"pt": "Filtros", "en": "Filters"},
    "tabSettings": {"pt": "Configurações", "en": "Settings"},
    "navSearchPh": {"pt": "buscar entidades, pontos, tiles…", "en": "search entities, points, tiles…"},
    "navAlive": {"pt": "Apenas vivos", "en": "Alive only"},
    "navClear": {"pt": "Limpar rotas", "en": "Clear paths"},
    "kindAll": {"pt": "Todos", "en": "All"},
    "kindLmt": {"pt": "Pontos Ref. & Terreno", "en": "Landmarks & Terrain"},
    "kindEnt": {"pt": "Entidades", "en": "Entities"},
    "navEmpty": {"pt": "Nada para navegar aqui.", "en": "Nothing to navigate here."},
    "watchTitle": {"pt": "Observados", "en": "Watched"},
    "watchSub": {"pt": "destacar + nomear pelo metadata", "en": "highlight + label by metadata"},
    "watchHint": {"pt": "Entidades cujo metadata contém um padrão são forçadas a desenhar com essa cor/forma/tamanho com o rótulo ao lado — mesmo se a categoria for normalmente ocultada. O primeiro que combinar vence.", "en": "Entities whose metadata contains a pattern are force-drawn in this color/shape/size with the label shown next to them — even if their category is normally filtered. First enabled match wins."},
    "btnAdd": {"pt": "+ Adicionar", "en": "+ Add"},
    "btnHide": {"pt": "+ Ocultar", "en": "+ Hide"},
    "hideTitle": {"pt": "Ocultos", "en": "Hidden"},
    "hideSub": {"pt": "remover do radar, lista & navegação", "en": "cull from radar, list & nav"},
    "hideHint": {"pt": "Entidades cujo metadata contém um padrão (ou globs */?) são removidas de todo lugar — overlay, lista de entidades e navegação.", "en": "Entities whose metadata contains a pattern (or matches a */? glob) are removed everywhere — overlay, entity list, and navigation."},
    "autoNavTitle": {"pt": "Padrões Auto-rota", "en": "Auto-path patterns"},
    "autoNavSub": {"pt": "auto-selecionar alvos de navegação na entrada da zona", "en": "auto-select nav targets on zone entry"},
    "autoNavHint": {"pt": "Ao entrar numa zona, todo alvo de navegação cujo caminho da tile / metadata da entidade contém um destes é auto-selecionado para desenhar a rota (até 8). Limpe tudo para desativar.", "en": "On entering a zone, every navigation target whose tile path / entity metadata contains one of these is auto-selected for path drawing (up to 8). Clear all to disable."},
    "suggText": {"pt": "Sugestões — clique para adicionar:", "en": "Suggestions — click to add:"},
    "lmTitle": {"pt": "Tiles de Pontos Ref.", "en": "Landmark tiles"},
    "lmSub": {"pt": "mostrar tiles de terreno como marcadores (visíveis em qualquer lugar)", "en": "surface terrain tiles as map markers (shown anywhere)"},
    "lmHint": {"pt": "Tiles de terreno cujo caminho contém um padrão são exibidos como pontos de referência — visíveis independentemente de onde você esteja no mapa. O rótulo opcional os renomeia; em branco usa o próprio nome da tile.", "en": "Terrain tiles whose path contains a pattern are surfaced as landmarks — visible regardless of where you are on the map (unlike entities, which only show in range). Optional label renames them; blank uses the tile's own name."},
    "savedMsg": {"pt": "✓ salvo nas configurações", "en": "✓ saved to config"},
    
    "dispRadar": {"pt": "Exibição do Radar", "en": "Radar Display"},
    "showMon": {"pt": "Mostrar monstros", "en": "Show monsters"},
    "showMonDesc": {"pt": "pontos inimigos no mapa", "en": "enemy dots on the map"},
    "showTerr": {"pt": "Mostrar terreno", "en": "Show terrain"},
    "showTerrDesc": {"pt": "mapa de terreno andável", "en": "walkable terrain map"},
    "showPl": {"pt": "Mostrar jogador", "en": "Show player"},
    "showPlDesc": {"pt": "ponto azul marcando sua posição", "en": "blue dot marking your position"},
    "showPath": {"pt": "Rotas de navegação", "en": "Navigation paths"},
    "showPathDesc": {"pt": "desenhar rotas A* até os pontos", "en": "draw A* paths to targets"},
    "useCurLm": {"pt": "Pontos Curados", "en": "Curated Landmarks"},
    "useCurLmDesc": {"pt": "nomes da comunidade (chefe / saídas)", "en": "community names (boss / exits)"},
    "fpsCap": {"pt": "Limite FPS (Overlay)", "en": "FPS Cap (Overlay)"},
    "fpsCapDesc": {"pt": "menor = menos carga; 60 é fluido", "en": "lower = less load; 60 is fluid"},

    "hpTitle": {"pt": "Barras HP Monstros", "en": "Monster HP Bars"},
    "hpSub": {"pt": "por raridade", "en": "by rarity"},
    "hpRarity": {"pt": "Raridade", "en": "Rarity"},
    "hpShow": {"pt": "Mostrar", "en": "Show"},
    "hpWidth": {"pt": "Larg.", "en": "Width"},
    "hpBorder": {"pt": "Borda", "en": "Border"},
    "hpThick": {"pt": "Esp.", "en": "Thick."},
    "hpNorm": {"pt": "Normal", "en": "Normal"},
    "hpMag": {"pt": "Mágico", "en": "Magic"},
    "hpRare": {"pt": "Raro", "en": "Rare"},
    "hpUni": {"pt": "Único", "en": "Unique"},
    "hpHeight": {"pt": "Altura", "en": "Height"},
    "hpOffX": {"pt": "Offset X", "en": "Offset X"},
    "hpOffY": {"pt": "Offset Y", "en": "Offset Y"},
    "hpHint": {"pt": "Preenchimento segue a cor do ícone; defina cor da borda e espessura por raridade (0 = sem borda). Y negativo = acima do mob.", "en": "Bar fill follows the monster icon color; set border color & thickness per rarity (thickness 0 = no border). Offset Y negative = above the mob."},
    
    "terrTitle": {"pt": "Terreno", "en": "Terrain"},
    "terrSub": {"pt": "overlay andável", "en": "walkable overlay"},
    "terrInt": {"pt": "Preenchimento", "en": "Interior fill"},
    "terrIntDesc": {"pt": "cor sobre as células andáveis", "en": "wash over walkable cells"},
    "terrEdge": {"pt": "Borda da parede", "en": "Wall edge"},
    "terrEdgeDesc": {"pt": "contornos em volta das salas", "en": "outlines around rooms"},
    "terrHint": {"pt": "Edições reconstroem o bitmap; use 'Mostrar terreno' acima para ocultar.", "en": "Edits rebuild the terrain bitmap; use 'Show terrain' above to hide it entirely."},

    "calTitle": {"pt": "Calibração do Mapa", "en": "Map Calibration"},
    "calScale": {"pt": "Multiplicador de escala", "en": "Scale multiplier"},
    "calScaleDesc": {"pt": "escala da projeção", "en": "projection scale of the map overlay"},
    "calOffX": {"pt": "Offset X", "en": "Offset X"},
    "calOffY": {"pt": "Offset Y", "en": "Offset Y"},
    "calHint": {"pt": "Ajuste aqui — mudanças aplicam na hora (sem atalhos in-game).", "en": "Adjust here — changes apply live (no in-game hotkeys)."},

    "flaskTitle": {"pt": "Auto-Poção", "en": "Auto-Flask"},
    "flaskLife": {"pt": "Limite Vida %", "en": "Life Threshold %"},
    "flaskLifeDesc": {"pt": "usar poção abaixo dessa %", "en": "use flask below this %"},
    "flaskMana": {"pt": "Limite Mana %", "en": "Mana Threshold %"},
    "flaskManaDesc": {"pt": "usar poção abaixo dessa %", "en": "use flask below this %"},
    "flaskLifeKey": {"pt": "Tecla Poção Vida", "en": "Life Flask Key"},
    "flaskManaKey": {"pt": "Tecla Poção Mana", "en": "Mana Flask Key"},
    "flaskLifeCd": {"pt": "Cooldown Vida", "en": "Life Cooldown"},
    "flaskLifeCdDesc": {"pt": "ms mínimo entre poções", "en": "min ms between flasks"},
    "flaskManaCd": {"pt": "Cooldown Mana", "en": "Mana Cooldown"},
    "flaskManaCdDesc": {"pt": "ms mínimo entre poções", "en": "min ms between flasks"},
    "flaskHint": {"pt": "F8 alterna a auto-poção in-game. Status:", "en": "F8 toggles auto-flask in-game. Status:"},

    "iconTitle": {"pt": "Ícones do Radar", "en": "Radar Icons"},
    "iconSub": {"pt": "forma · cor · opacidade · tamanho", "en": "shape · color · opacity · size"},
    
    "mechTitle": {"pt": "Mecânicas", "en": "Mechanics"},
    "mechSub": {"pt": "sobrescrever ícones por metadata", "en": "metadata-matched icon overrides"},
    "mechHint": {"pt": "Quando o metadata contém algum termo (sep. por vírgula) — e é de um dos tipos sel. — desenha este ícone em vez do padrão. Primeiro ativado vence.", "en": "When an entity's metadata contains any comma-separated match term — and it's one of the selected types — it draws this icon instead of its generic dot. First enabled match wins."},
    "mechBtn": {"pt": "+ Adicionar mecânica", "en": "+ Add mechanic"},
    
    "censo": {"pt": "Censo", "en": "Census"},
    "watchPh": {"pt": "padrão metadata (ex: Strongbox)", "en": "metadata pattern (e.g. Strongbox)"},
    "labelPh": {"pt": "rótulo (ex: Baú)", "en": "label (e.g. Strongbox)"},
    "hidePh": {"pt": "padrão/glob para ocultar (ex: AbyssCrack, *Daemon*)", "en": "pattern or glob to hide (e.g. AbyssCrack, *Daemon*)"},
    "autoNavPh": {"pt": "padrão (ex: Waypoint)", "en": "pattern (e.g. Waypoint)"},
    "lmPh": {"pt": "padrão do tile (ex: Vendor, Sanctum)", "en": "tile-path pattern (e.g. Vendor, Sanctum)"},
    "lmlabelPh": {"pt": "rótulo (opcional)", "en": "label (optional)"}
}

html = re.sub(r'Censo</div>', '<span data-i18n="censo">Censo</span></div>', html)
html = re.sub(r'<div class="l">Entidades</div>', '<div class="l" data-i18n="cEnt">Entidades</div>', html)
html = re.sub(r'<div class="l">Pontos de Int\.</div>', '<div class="l" data-i18n="cPoi">Pontos de Int.</div>', html)
html = re.sub(r'<div class="l">Monstros</div>', '<div class="l" data-i18n="cMon">Monstros</div>', html)
html = re.sub(r'<div class="l">Pontos Ref\.</div>', '<div class="l" data-i18n="cLm">Pontos Ref.</div>', html)

html = re.sub(r'>Painel<', ' data-i18n="tabDash">Painel<', html)
html = re.sub(r'>Filtros<', ' data-i18n="tabFilters">Filtros<', html)
html = re.sub(r'>Configurações<', ' data-i18n="tabSettings">Configurações<', html)

html = re.sub(r'placeholder="buscar entidades, pontos, tiles…"', 'placeholder="buscar entidades, pontos, tiles…" data-i18n-ph="navSearchPh"', html)
html = re.sub(r'>Apenas vivos<', ' data-i18n="navAlive">Apenas vivos<', html)
html = re.sub(r'>Limpar rotas<', ' data-i18n="navClear">Limpar rotas<', html)

html = re.sub(r'>Todos<', ' data-i18n="kindAll">Todos<', html)
html = re.sub(r'>Pontos Ref\. &amp; Terreno<', ' data-i18n="kindLmt">Pontos Ref. &amp; Terreno<', html)
html = re.sub(r'>Entidades</button>', ' data-i18n="kindEnt">Entidades</button>', html)
html = re.sub(r'>Nada para navegar aqui\.<', ' data-i18n="navEmpty">Nada para navegar aqui.<', html)

html = re.sub(r'>Watched <span class="tag">&middot; highlight \+ label by metadata</span>', '><span data-i18n="watchTitle">Watched</span> <span class="tag">&middot; <span data-i18n="watchSub">highlight + label by metadata</span></span>', html)
html = re.sub(r'Entities whose metadata contains a pattern are force-drawn[^<]+', '<span data-i18n="watchHint">Entities whose metadata contains a pattern are force-drawn in this color/shape/size with the label shown next to them &mdash; even if their category is normally filtered. First enabled match wins.</span>', html)

html = re.sub(r'>\+ Add<', ' data-i18n="btnAdd">+ Add<', html)
html = re.sub(r'>\+ Hide<', ' data-i18n="btnHide">+ Hide<', html)
html = re.sub(r'>\+ Add mechanic<', ' data-i18n="mechBtn">+ Add mechanic<', html)

html = re.sub(r'>Hidden <span class="tag">&middot; cull from radar, list &amp; nav</span>', '><span data-i18n="hideTitle">Hidden</span> <span class="tag">&middot; <span data-i18n="hideSub">cull from radar, list &amp; nav</span></span>', html)
html = re.sub(r'Entities whose metadata contains a pattern \(or matches a <code>\*</code>/<code>\?</code> glob\) are removed everywhere [^<]+', '<span data-i18n="hideHint">Entities whose metadata contains a pattern (or matches a <code>*</code>/<code>?</code> glob) are removed everywhere &mdash; overlay, entity list, and navigation.</span>', html)

html = re.sub(r'>Auto-path patterns <span class="tag">&middot; auto-select nav targets on zone entry</span>', '><span data-i18n="autoNavTitle">Auto-path patterns</span> <span class="tag">&middot; <span data-i18n="autoNavSub">auto-select nav targets on zone entry</span></span>', html)
html = re.sub(r'On entering a zone, every navigation target whose tile path / entity metadata contains one of these is auto-selected for path drawing \(up to 8\)\. Clear all to disable\.', '<span data-i18n="autoNavHint">On entering a zone, every navigation target whose tile path / entity metadata contains one of these is auto-selected for path drawing (up to 8). Clear all to disable.</span>', html)
html = re.sub(r'Suggestions &mdash; click to add:', '<span data-i18n="suggText">Suggestions &mdash; click to add:</span>', html)

html = re.sub(r'>Landmark tiles <span class="tag">&middot; surface terrain tiles as map markers \(shown anywhere\)</span>', '><span data-i18n="lmTitle">Landmark tiles</span> <span class="tag">&middot; <span data-i18n="lmSub">surface terrain tiles as map markers (shown anywhere)</span></span>', html)
html = re.sub(r'Terrain tiles whose path contains a pattern are surfaced as landmarks &mdash; visible regardless of where you are on the map[^<]+', '<span data-i18n="lmHint">Terrain tiles whose path contains a pattern are surfaced as landmarks &mdash; visible regardless of where you are on the map (unlike entities, which only show in range). Optional label renames them; blank uses the tile\'s own name. Built-in features (bosses, waypoints, league mechanics) already show &mdash; add your own here.</span>', html)

html = re.sub(r'&#10003; saved to config', '&#10003; <span data-i18n="savedMsg">saved to config</span>', html)

html = re.sub(r'>Exibição do Radar<', ' data-i18n="dispRadar">Exibição do Radar<', html)
html = re.sub(r'>Mostrar monstros<', ' data-i18n="showMon">Mostrar monstros<', html)
html = re.sub(r'>pontos inimigos no mapa<', ' data-i18n="showMonDesc">pontos inimigos no mapa<', html)
html = re.sub(r'>Mostrar terreno<', ' data-i18n="showTerr">Mostrar terreno<', html)
html = re.sub(r'>mapa de terreno andável<', ' data-i18n="showTerrDesc">mapa de terreno andável<', html)
html = re.sub(r'>Mostrar jogador<', ' data-i18n="showPl">Mostrar jogador<', html)
html = re.sub(r'>ponto azul marcando sua posição<', ' data-i18n="showPlDesc">ponto azul marcando sua posição<', html)
html = re.sub(r'>Rotas de navegação<', ' data-i18n="showPath">Rotas de navegação<', html)
html = re.sub(r'>desenhar rotas A&#42; até os pontos<', ' data-i18n="showPathDesc">desenhar rotas A&#42; até os pontos<', html)
html = re.sub(r'>Pontos Curados<', ' data-i18n="useCurLm">Pontos Curados<', html)
html = re.sub(r'>nomes da comunidade \(chefe / saídas\)<', ' data-i18n="useCurLmDesc">nomes da comunidade (chefe / saídas)<', html)
html = re.sub(r'>Limite FPS \(Overlay\)<', ' data-i18n="fpsCap">Limite FPS (Overlay)<', html)
html = re.sub(r'>menor = menos carga; 60 é fluido \(15&ndash;360\)<', ' data-i18n="fpsCapDesc">menor = menos carga; 60 é fluido (15&ndash;360)<', html)

html = re.sub(r'>Barras HP Monstros <span class="tag">&middot; por raridade</span>', '><span data-i18n="hpTitle">Barras HP Monstros</span> <span class="tag">&middot; <span data-i18n="hpSub">por raridade</span></span>', html)
html = re.sub(r'>Raridade<', ' data-i18n="hpRarity">Raridade<', html)
html = re.sub(r'>Mostrar<', ' data-i18n="hpShow">Mostrar<', html)
html = re.sub(r'>Larg\.<', ' data-i18n="hpWidth">Larg.<', html)
html = re.sub(r'>Borda<', ' data-i18n="hpBorder">Borda<', html)
html = re.sub(r'>Esp\.<', ' data-i18n="hpThick">Esp.<', html)
html = re.sub(r'>Normal<', ' data-i18n="hpNorm">Normal<', html)
html = re.sub(r'>Magic<', ' data-i18n="hpMag">Magic<', html)
html = re.sub(r'>Rare<', ' data-i18n="hpRare">Rare<', html)
html = re.sub(r'>Unique<', ' data-i18n="hpUni">Unique<', html)
html = re.sub(r'>Height<', ' data-i18n="hpHeight">Height<', html)
html = re.sub(r'>Offset X<', ' data-i18n="hpOffX">Offset X<', html)
html = re.sub(r'>Offset Y<', ' data-i18n="hpOffY">Offset Y<', html)
html = re.sub(r'Bar fill follows the monster icon color; set border color &amp; thickness per rarity \(thickness 0 = no border\)\. Offset Y negative = above the mob\.', '<span data-i18n="hpHint">Bar fill follows the monster icon color; set border color &amp; thickness per rarity (thickness 0 = no border). Offset Y negative = above the mob.</span>', html)

html = re.sub(r'>Terrain <span class="tag">&middot; walkable overlay</span>', '><span data-i18n="terrTitle">Terrain</span> <span class="tag">&middot; <span data-i18n="terrSub">walkable overlay</span></span>', html)
html = re.sub(r'>Interior fill<', ' data-i18n="terrInt">Interior fill<', html)
html = re.sub(r'>wash over walkable cells<', ' data-i18n="terrIntDesc">wash over walkable cells<', html)
html = re.sub(r'>Wall edge<', ' data-i18n="terrEdge">Wall edge<', html)
html = re.sub(r'>outlines around rooms<', ' data-i18n="terrEdgeDesc">outlines around rooms<', html)
html = re.sub(r'Edits rebuild the terrain bitmap; use &ldquo;Show terrain&rdquo; above to hide it entirely\.', '<span data-i18n="terrHint">Edits rebuild the terrain bitmap; use &ldquo;Show terrain&rdquo; above to hide it entirely.</span>', html)

html = re.sub(r'>Map Calibration<', ' data-i18n="calTitle">Map Calibration<', html)
html = re.sub(r'>Scale multiplier<', ' data-i18n="calScale">Scale multiplier<', html)
html = re.sub(r'>projection scale of the map overlay<', ' data-i18n="calScaleDesc">projection scale of the map overlay<', html)
html = re.sub(r'>Offset X<', ' data-i18n="calOffX">Offset X<', html)
html = re.sub(r'>Offset Y<', ' data-i18n="calOffY">Offset Y<', html)
html = re.sub(r'Adjust here &mdash; changes apply live \(no in-game hotkeys\)\.', '<span data-i18n="calHint">Adjust here &mdash; changes apply live (no in-game hotkeys).</span>', html)

html = re.sub(r'>Auto-Poção<', ' data-i18n="flaskTitle">Auto-Poção<', html)
html = re.sub(r'>Limite Vida %<', ' data-i18n="flaskLife">Limite Vida %<', html)
html = re.sub(r'>usar poção abaixo dessa %<', ' data-i18n="flaskLifeDesc">usar poção abaixo dessa %<', html)
html = re.sub(r'>Limite Mana %<', ' data-i18n="flaskMana">Limite Mana %<', html)
html = re.sub(r'>Tecla Poção de Vida<', ' data-i18n="flaskLifeKey">Tecla Poção de Vida<', html)
html = re.sub(r'>Tecla Poção de Mana<', ' data-i18n="flaskManaKey">Tecla Poção de Mana<', html)
html = re.sub(r'>Cooldown Vida<', ' data-i18n="flaskLifeCd">Cooldown Vida<', html)
html = re.sub(r'>Cooldown Mana<', ' data-i18n="flaskManaCd">Cooldown Mana<', html)
html = re.sub(r'>ms mínimo entre poções<', ' data-i18n="flaskManaCdDesc">ms mínimo entre poções<', html) # using same desc
html = re.sub(r'F8 alterna a auto-poção in-game\. Status:', '<span data-i18n="flaskHint">F8 alterna a auto-poção in-game. Status:</span>', html)

html = re.sub(r'>Radar Icons <span class="tag">&middot; shape &middot; color &middot; opacity &middot; size</span>', '><span data-i18n="iconTitle">Radar Icons</span> <span class="tag">&middot; <span data-i18n="iconSub">shape &middot; color &middot; opacity &middot; size</span></span>', html)

html = re.sub(r'>Mechanics <span class="tag">&middot; metadata-matched icon overrides</span>', '><span data-i18n="mechTitle">Mechanics</span> <span class="tag">&middot; <span data-i18n="mechSub">metadata-matched icon overrides</span></span>', html)
html = re.sub(r'When an entity\'s metadata contains any comma-separated match term &mdash; and it\'s one of the selected types &mdash; it draws this icon instead of its generic dot\. First enabled match wins\.', '<span data-i18n="mechHint">When an entity\'s metadata contains any comma-separated match term &mdash; and it\'s one of the selected types &mdash; it draws this icon instead of its generic dot. First enabled match wins.</span>', html)

html = re.sub(r'placeholder="metadata pattern \(e\.g\. Strongbox\)"', 'placeholder="metadata pattern (e.g. Strongbox)" data-i18n-ph="watchPh"', html)
html = re.sub(r'placeholder="label \(e\.g\. Strongbox\)"', 'placeholder="label (e.g. Strongbox)" data-i18n-ph="labelPh"', html)
html = re.sub(r'placeholder="pattern or glob to hide \(e\.g\. AbyssCrack, \*Daemon\*\)"', 'placeholder="pattern or glob to hide (e.g. AbyssCrack, *Daemon*)" data-i18n-ph="hidePh"', html)
html = re.sub(r'placeholder="pattern \(e\.g\. Waypoint\)"', 'placeholder="pattern (e.g. Waypoint)" data-i18n-ph="autoNavPh"', html)
html = re.sub(r'placeholder="tile-path pattern \(e\.g\. Vendor, Sanctum, Waygate\)"', 'placeholder="tile-path pattern (e.g. Vendor, Sanctum, Waygate)" data-i18n-ph="lmPh"', html)
html = re.sub(r'placeholder="label \(optional\)"', 'placeholder="label (optional)" data-i18n-ph="lmlabelPh"', html)

# Modify JS dict block
import json
dict_pt = { "life":"Vida", "mana":"Mana", "shield":"Escudo", "zone":"Zona", "area":"Área", "areaCode":"Cód. Área", "areaLvl":"Ato / Nível da Área", "activeTime":"Tempo Ativo", "mapOpen":"Mapa aberto", "autoFlask":"Auto-poção", "streamerMode":"Modo Streamer", "streamerDesc":"Ocultar o nome e o level do seu personagem do radar para privacidade.", "language":"Idioma", "langDesc":"Escolha o idioma do painel.", "you":"Você", "hidden":"Oculto", "act":"Ato", "areaLvlNum":"Área Lvl", "yes":"sim", "no":"não", "on":"ligado", "off":"desligado", "inGame":"no jogo", "menu":"cidade/menu" }
dict_en = { "life":"Life", "mana":"Mana", "shield":"Shield", "zone":"Zone", "area":"Area", "areaCode":"Area Code", "areaLvl":"Act / Area Level", "activeTime":"Active Time", "mapOpen":"Map Open", "autoFlask":"Auto-Flask", "streamerMode":"Streamer Mode", "streamerDesc":"Hide your character name and level from the radar for privacy.", "language":"Language", "langDesc":"Choose the dashboard language.", "you":"You", "hidden":"Hidden", "act":"Act", "areaLvlNum":"Area Lvl", "yes":"yes", "no":"no", "on":"on", "off":"off", "inGame":"in game", "menu":"town/menu" }

for k, v in translations.items():
    dict_pt[k] = v["pt"]
    dict_en[k] = v["en"]

new_dict_str = f"const dict = {{\n  pt: {json.dumps(dict_pt, ensure_ascii=False)},\n  en: {json.dumps(dict_en, ensure_ascii=False)}\n}};"

html = re.sub(r'const dict = \{.*?\n\};', new_dict_str, html, flags=re.DOTALL)

# Add applyTranslations logic for placeholders
new_apply = """function applyTranslations() {
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
}"""

html = re.sub(r'function applyTranslations\(\) \{.*?\n\}', new_apply, html, flags=re.DOTALL)

with open('f:\\RF\\Poe2\\src\\POE2Radar.Overlay\\Web\\DashboardHtml.cs', 'w', encoding='utf-8') as f:
    f.write(html)

print("HTML updated with robust i18n tags!")
