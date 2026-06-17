
const dict = {
  pt: {"alwaysShow": "Sempre mostrar overlay", "alwaysShowDesc": "desenhar mesmo sem foco no PoE2", "hideJunk": "Ocultar lixo cosmético", "hideJunkDesc": "suprimir pontos cosméticos / FX", "showLms": "Nomes curados", "showLmsDesc": "rótulos curados da comunidade", "pricingHigh": "Valor de Destaque", "pricingHighDesc": "borda/ênfase a partir deste valor (Ex)", "invTool": "Ferramenta Inventário / Baú", "invToolDesc": "ler atributos e preços dos itens sob o mouse", "tabRules": "Regras", "rulesTitle": "Regras de Exibição", "rulesSub": "um único conjunto ordenado — a primeira regra que combinar vence", "atlasTitle": "Destaques do Atlas", "atlasSub": "apenas mapas destacados são exibidos no jogo", "lmSubNew": "rótulos curados do mapa — ver, fixar, compartilhar", "hideSubNew": "ocultar totalmente do radar, lista e nav", "life": "Vida", "mana": "Mana", "shield": "Escudo", "zone": "Zona", "area": "Área", "areaCode": "Cód. Área", "areaLvl": "Ato / Nível da Área", "activeTime": "Tempo Ativo", "mapOpen": "Mapa aberto", "autoFlask": "Auto-poção", "streamerMode": "Modo Streamer", "streamerDesc": "Ocultar o nome e o level do personagem.", "language": "Idioma", "langDesc": "Escolha o idioma do painel.", "you": "Você", "hidden": "Oculto", "act": "Ato", "areaLvlNum": "Área Lvl", "yes": "sim", "no": "não", "on": "ligado", "off": "desligado", "inGame": "no jogo", "menu": "cidade/menu", "cEnt": "Entidades", "cPoi": "Pontos de Int.", "cMon": "Monstros", "cLm": "Pontos Ref.", "tabDash": "Painel", "tabSettings": "Configurações", "navSearchPh": "buscar entidades, pontos, tiles…", "navAlive": "Apenas vivos", "navClear": "Limpar rotas", "kindAll": "Todos", "kindLmt": "Pontos Ref. & Terreno", "kindEnt": "Entidades", "navEmpty": "Nada para navegar aqui.", "hideTitle": "Ocultos", "lmTitle": "Tiles de Pontos Ref.", "savedMsg": "✓ salvo nas configurações", "dispRadar": "Exibição do Radar", "showMon": "Mostrar monstros", "showMonDesc": "pontos inimigos no mapa", "showTerr": "Mostrar terreno", "showTerrDesc": "mapa de terreno andável", "showPl": "Mostrar jogador", "showPlDesc": "ponto azul marcando sua posição", "showPath": "Rotas de navegação", "showPathDesc": "desenhar rotas A* até os pontos", "fpsCap": "Limite FPS (Overlay)", "fpsCapDesc": "menor = menos carga; 60 é fluido", "hpTitle": "Barras HP Monstros", "hpSub": "por raridade", "hpRarity": "Raridade", "hpShow": "Mostrar", "hpWidth": "Larg.", "hpBorder": "Borda", "hpThick": "Esp.", "hpNorm": "Normal", "hpMag": "Mágico", "hpRare": "Raro", "hpUni": "Único", "hpHeight": "Altura", "hpOffX": "Offset X", "hpOffY": "Offset Y", "terrTitle": "Terreno", "terrSub": "overlay andável", "terrInt": "Preenchimento", "terrIntDesc": "cor sobre as células andáveis", "terrEdge": "Borda da parede", "terrEdgeDesc": "contornos em volta das salas", "calTitle": "Calibração do Mapa", "calScale": "Multiplicador de escala", "calScaleDesc": "escala da projeção", "calOffX": "Offset X", "calOffY": "Offset Y", "flaskTitle": "Auto-Poção", "flaskLife": "Limite Vida %", "flaskLifeDesc": "usar poção abaixo dessa %", "flaskMana": "Limite Mana %", "flaskLifeKey": "Tecla Poção Vida", "flaskManaKey": "Tecla Poção Mana", "flaskLifeCd": "Cooldown Vida", "flaskManaCd": "Cooldown Mana", "flaskManaCdDesc": "ms mínimo entre poções", "iconTitle": "Ícones do Radar", "iconSub": "forma · cor · opacidade · tamanho", "censo": "Censo", "pricingTitle": "Preços de Itens no Chão", "pricingSub": "poe2scout", "pricingEnabled": "Habilitado", "pricingEnabledDesc": "desenhar valores em cima dos itens caídos", "pricingCats": "Mostrar valor para estas categorias:", "pricingUniqueMin": "Valor mínimo para Únicos", "pricingUniqueMinDesc": "ocultar únicos que valem menos que isso (Ex)", "pricingOtherMin": "Valor mínimo para os Outros", "pricingOtherMinDesc": "ocultar itens não-únicos abaixo deste valor", "Uniques": "Únicos", "Runes": "Runas", "Essences": "Essências", "Currency": "Moedas", "Fragments": "Fragmentos", "Breach": "Breach", "Ritual": "Ritual", "Delirium": "Delirium", "Expedition": "Expedition", "itemIdentTitle": "Reconhecimento de Itens", "itemIdentSub": "ler mods/engastes e valores no inventário", "itemIdentMode": "Modo de Reconhecimento", "itemIdentHover": "Ao Passar o Mouse (Pressione Shift)", "itemIdentHold": "Segure a Tecla", "itemIdentKey": "Tecla para Ler Itens"},
  en: {}
};

let i18n = dict.en;

function applyTranslations() {
  const saved = localStorage.getItem('langPref') || 'auto';
  let lang = saved;
  if (saved === 'auto') {
    lang = navigator.language.startsWith('pt') ? 'pt' : 'en';
  }
  
  const sel = document.getElementById('setLang');
  if(sel) sel.value = saved;
  
  i18n = dict[lang] || dict.en;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(i18n[key]) {
      // Keep small tags inside rl
      const small = el.querySelector('small');
      if (small) {
         el.childNodes[0].textContent = i18n[key];
      } else {
         el.textContent = i18n[key];
      }
    }
  });
  
  // Custom replacements
  const act = document.getElementById('connTxt');
  if(act && act.textContent === 'in game' && i18n.inGame) act.textContent = i18n.inGame;
}

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  
  const langSel = document.getElementById('setLang');
  if(langSel) {
    langSel.addEventListener('change', (e) => {
      localStorage.setItem('langPref', e.target.value);
      applyTranslations();
    });
  }
});
