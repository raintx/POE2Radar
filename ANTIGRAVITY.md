# POE2Radar — Antigravity Guide

External memory-reading **map/radar overlay for Path of Exile 2**. .NET 10, Windows, x64 only.
Reads game state out of process (no injection) and draws an overlay; an opt-in auto-flask feature
sends keystrokes. Forked from a PoE1 framework, since rewritten around the live PoE2 layout.

## Regras Inegociáveis para o Antigravity

**PoE2, não PoE1.** Offsets são específicos do PoE2 e mudam com os patches. Valores validados ficam em
`Game/Poe2Offsets.cs` (marcados com `✓` quando confirmados ativos); re-descubra via os probes do `POE2Radar.Research`.

**Mantenha-se externo.** Acesso à memória via `OpenProcess` + `ReadProcessMemory`. **Nunca** injete no
processo do PoE2 — sem injeção de DLL, sem hooking de função, sem manipulação de pacotes.

**Entrada/automação (opt-in).** O overlay pode enviar keystrokes via `SendInput`
(`Input/SendInputNative`) apenas para auto-flask. Regras: bloqueado por foreground (apenas quando o PoE2 estiver focado),
bloqueado in-game, cooldowns por ação, tecla de segurança mestre (F8). Mantenha a automação mínima e
claramente bloqueada — é uma ferramenta pessoal de QoL, não um bot autônomo.

**A descoberta de offsets fica no Research.** O overlay apenas lê; a engenharia reversa/probes ficam em
`POE2Radar.Research`. Quando um patch quebrar as leituras, rode os probes do Research, re-valide, faça o commit.

**Layout de três pilares.** Exatamente três projetos:
- `src/POE2Radar.Core` — infraestrutura de memória + tabela de offsets do PoE2 + camada de leitura ao vivo. Lado de leitura.
- `src/POE2Radar.Overlay` — loop de tick, overlay Direct2D, API HTTP, entrada opt-in. O `.exe` final.
- `src/POE2Radar.Research` — ferramentas de descoberta/validação de desenvolvimento. Nunca lincado ao overlay.

## Arquitetura

**Ponto de entrada:** `src/POE2Radar.Overlay/Program.cs` — attach (`ProcessHandle.AttachToPoE`) →
`Bootstrap.ResolveGameStateSlot` (scan AOB para o ponteiro do GameState, validado por uma chain funcionando)
→ `RadarApp.Run`.

**Camada central de leitura:**
- `MemoryReader.cs`, `ProcessHandle.cs`, `Native/` — Win32 + leituras tipadas. `AttachToPoE` lista os
  nomes dos processos do cliente PoE2.
- `Game/Poe2Offsets.cs` — **única fonte de verdade para todos os offsets do PoE2** (validados + fonte GameHelper2;
  marcadores `✓` = confirmados ativos).
- `Game/Poe2Live.cs` — o leitor ao vivo: resolve GameState → InGameState → AreaInstance →
  LocalPlayer a cada tick; lê os status vitais do jogador, percorre os std::maps de entidades dividindo em pontos categorizados
  (raridade, reação/hostilidade, POI via MinimapIcon, HP), lê a grade de terreno andável, o elemento
  UI do mapa (visibilidade/shift/zoom), pontos de referência de tiles e informações de área/personagem. Armazena em cache endereços de
  componentes por entidade; a chave do cache é o endereço AreaInstance (invalida ao mudar de zona).
- `Game/GameStructs.cs` — structs blittables (`StdVector`, `Vector2/3`, `VitalStruct`).
- `Game/AobScanner.cs` + `AobPatterns.cs` — scan de padrão para o slot global do GameState.
- `Game/LifeValidator.cs` — scan de valor para encontrar o componente Life por HP (Research `--hp`).
- `Pathfinding/MapProjection.cs` + `GridConstants.cs` — projeção de grade isométrica→tela e a
  escala grade↔mundo (250/23 ≈ 10.87).

**Overlay** (`src/POE2Radar.Overlay/`):
- `RadarApp.cs` — loop de tick. Taxa de renderização (~144 Hz): jogador ao vivo + renderização. Taxa de mundo (~30 Hz):
  atualiza entidades/terreno/pontos de referência. Publica um `RadarState` para a API; roda o auto-flask.
- `Overlay/OverlayWindow.cs` — janela com alpha por pixel (`UpdateLayeredWindow`), rastreia a
  janela do jogo. `Overlay/OverlayRenderer.cs` — Direct2D: bitmap do terreno + pontos das entidades + marcadores
  de referência + barras de HP no espaço do mundo + blip do jogador + HUD. Desenhado apenas quando o PoE2 está focado. Forma/cor/opacidade/tamanho do ícone
  por item, overrides "mechanic" combinados com metadados e geometria da barra de HP são
  controlados por configuração via `RadarSettings.Styles` / `.HpBars` (os padrões espelham o antigo visual hardcoded) e
  editáveis ao vivo na aba de Configurações do Console. A raridade da barra de HP é sinalizada pelo dimensionamento do peso da borda.
  *Formas* de ícones são SVGs nomeados de `Overlay/IconLibrary.cs` — conjunto embutido materializado em uma
  pasta `icons/` ao lado do exe na primeira execução (irmã da pasta `config/`); qualquer `*.svg` deixado lá
  (único/múltiplo `<path>`) substitui um embutido ou adiciona um novo ícone. `Overlay/SvgPath.cs` converte cada
  path `d` (M/L/H/V/C/S/Q/T/Z + A→cubic) em figuras que o renderizador normaliza (viewBox→unit) e
  armazena em cache como uma `ID2D1PathGeometry` por nome.
- `Overlay/TerrainBitmap.cs` — assa a grade andável em um bitmap, reconstruído por área.
- `Web/ApiServer.cs` — API HTTP somente leitura em `localhost:7777` (`/state`, `/entities`, `/landmarks`,
  `/api/icons` — a biblioteca de ícones para os seletores de formas SVG-preview do dashboard).
- `Input/SendInputNative.cs` — `SendInput` de scancode para auto-flask.

**Research** (`src/POE2Radar.Research/Program.cs`) — probes: `--hp` (value-scan), `--chain`,
`--entity`, `--find`/`--find-entities`/`--find-terrain`/`--find-map`, `--tiles`, `--rarity`,
`--info`, `--watch` (logger de mudança de área), `--dump`.

## Fatos Chave (validados ao vivo; re-verificar por patch)

- Chain: AOB "Game States" → GameState → InGameState (estado ativo) → `AreaInstance @ +0x290` →
  `LocalPlayer @ +0x5A0`.
- AreaInstance: AreaInfo `+0xA0` (código), AreaLevel `+0xC4`, AreaHash `+0x11C`, AwakeEntities std::map
  `+0x6C0` / Sleeping `+0x6D0`, TerrainStruct `+0x8A0` (walkable `+0xD0`, BytesPerRow `+0x130`).
- Entidade: Detalhes `+0x08`, ComponentList `+0x10`; mapa de componentes via ComponentLookUp StdBucket.
  Raridade = ObjectMagicProperties `+0x144`; hostilidade = Positioned.Reaction `+0x1E0` (amigável = bit
  pattern `(b&0x7F)==1`); grade = Render world `+0x138` / 10.87; Life HP `+0x1A8` / Mana `+0x1F8` / ES
  `+0x230`; Nome do jogador `+0x1B0`, nível `+0x204`.
- UI do Mapa: UiRoot `InGameState +0x2F0`; UiElement Self `+0x08`, Children `+0x10`, Flags `+0x180`
  (visível = bit `0x0B`); MapUiElement Shift `+0x368`, DefaultShift `+0x370` (= (0,-20)), Zoom `+0x3A8`.
- **Ainda TBD:** matriz mundo→tela da câmera (para nameplates no espaço do mundo); string Name de área amigável.

## Dependências
- `Vortice.Direct2D1` (renderização de overlay). Segmenta `net10.0-windows`, x64.
