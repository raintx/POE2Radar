# POE2Radar — Contributor Guide

External, read-only memory-reading **map/radar overlay for Path of Exile 2**. .NET 10, Windows,
x64 only. Forked from the BubblesBot (PoE1) framework; PoE1 game data stripped.

## Non-negotiable rules

**PoE2, not PoE1.** This is the *new* game. Do not reintroduce PoE1 mechanics, leagues, scarabs,
atlas content, or PoE1 offset values as if they are correct. PoE1 carryover offsets in
`KnownOffsets.cs` are an *unverified starting point* — treat every one as wrong until validated
against live PoE2.

**Stay external.** Memory access via `OpenProcess` + `ReadProcessMemory`. **Never** inject into
the PoE2 process — no DLL injection, no function hooking, no packet manipulation.

**Input/automation (opt-in).** As of the auto-flask feature, the overlay may send keystrokes via
`SendInput` (`Input/SendInputNative`). Rules: foreground-gated (only when PoE2 is the focused
window), in-game-gated, per-action cooldowns, and a master kill-switch hotkey (F8). Keep automation
minimal and clearly gated; this is a personal QoL tool, not a headless bot.

**No self-healing offsets.** The overlay validates a handful of canary reads at startup
(`CanaryCheck`) and refuses to run if they fail. Offset *discovery* lives in
`POE2Radar.Research`, never in the overlay. When a PoE2 patch breaks reads, run Research,
re-validate, commit the new table, restart.

**Three-pillar layout.** Exactly three projects:
- `src/POE2Radar.Core` — memory plumbing, offset table, readers, snapshot/cache. Pure read-side.
- `src/POE2Radar.Overlay` — tick loop + Direct2D overlay. The deliverable `.exe`.
- `src/POE2Radar.Research` — dev-time discovery/validation tooling. Never linked into the overlay.

## Architecture

**Entry point:** `src/POE2Radar.Overlay/Program.cs` — attach → `Bootstrap.ResolveIngameData`
(AOB scan, `--hp` value-scan fallback) → `CanaryCheck` → `RadarApp.Run`.

**Tick model** (`RadarApp`): two cadences.
- *Render rate* (~144 Hz): read `LivePlayer`, track the game window, render the overlay. Projects
  cached entity grid coords through the live player position so blips track smoothly.
- *World rate* (~30 Hz): build a fresh `GameSnapshot`, refresh `EntityCache`, recompute the debug
  A* path. Expensive entity-walk reads only happen at this cadence.

**Core layout:**
- `MemoryReader.cs`, `ProcessHandle.cs`, `Native/` — Win32 + typed reads. `ProcessHandle.AttachToPoE`
  searches candidate process names — **add the PoE2 client's process name here.**
- `Game/KnownOffsets.cs` — single source of truth for all memory offsets. Overlay code reads
  these only through the snapshot layer, never directly.
- `Game/*Reader.cs`, `GameStructs.cs`, `EntityComponents.cs` — raw read helpers.
- `Game/AobScanner.cs` + `AobPatterns.cs` — pattern scan to locate the IngameState global pointer.
- `Snapshot/` — the ergonomic per-tick API: `GameSnapshot`, `PlayerView`, `LivePlayer`,
  `EntityCache`, `CameraView` (matrix world→screen), `MapView`, `NavGrid` (terrain layers),
  `WindowInfo`, `ElementGeometry`, `CanaryCheck`, `GroundLabelView`.
- `Pathfinding/` — `GridConstants` (grid↔world scale — **re-calibrate for PoE2**), `AStar`,
  `MapProjection` (isometric grid→screen), `PathSmoother`, terrain cell readers.

**Overlay layout** (`src/POE2Radar.Overlay/Overlay/`):
- `OverlayWindow` — per-pixel-alpha layered window (`UpdateLayeredWindow`), tracks the game window.
- `OverlayRenderer` — Direct2D: terrain bitmap projected onto PoE2's expanded map + entity dots
  (mob blob geometry, rares/uniques) + player blip + debug A* path.
- `TerrainBitmap` — bakes the walkable-terrain layer into a bitmap, rebuilt per area hash.
- `RenderContext` — what the renderer needs each frame, built fresh by `RadarApp`.

## Critical rules (carried from the engine lineage — re-verify for PoE2)

- **Grid units.** Positions/distances use entity grid position. World coords only at the two
  projection call sites (grid→world multiply, `Camera.WorldToScreen`). The grid↔world scale
  (`GridConstants`, PoE1 = 10.88) **must be re-derived for PoE2.**
- **Map projection.** `OverlayRenderer` paints onto PoE's expanded-map canvas using the same
  center/scale math the Radar plugin uses. `SubMap` zoom/shift offsets and the scale divisor are
  **PoE1 values — re-discover for PoE2.**
- **Area transitions.** `IngameData` is replaced on every area change — re-resolve it from
  `IngameState.Data` each tick. Clear `EntityCache` and rebuild the terrain bitmap on area-hash
  change.
- **Canary on startup.** If offsets are stale the overlay must fail loud, not draw garbage.

## Offset workflow (the main near-term task)

1. Author/refresh `resources/community-offsets.md` with PoE2 community offset notes.
2. Transcribe into `Game/KnownOffsets.cs`. Mark each `// unverified` until proven.
3. `POE2Radar.Research --hp <currentHp>` — value-scan for the Life component to anchor the player
   and back-walk to IngameData when AOB patterns aren't populated yet.
4. `POE2Radar.Research` (AOB mode) once `AobPatterns.cs` has a PoE2 IngameState pattern.
5. Validate each offset against a known in-game value; flip `// unverified` → `// ✓` as confirmed.
6. There is no POEMCP for PoE2 — validation is manual / value-scan based, not oracle-driven.

## Dependencies
- `Vortice.Direct2D1` (overlay rendering). Targets `net10.0-windows`, x64.
