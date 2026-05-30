namespace POE2Radar.Core.Game;

/// <summary>
/// Field offsets into the PoE2 client's game structs, sourced from
/// <c>resources/community-offsets.md</c>.
///
/// <para><b>PoE1 CARRYOVER — TREAT EVERY VALUE AS UNVERIFIED.</b> These offsets were inherited
/// from the PoE1 framework this overlay was forked from. PoE2 is a different client; the struct
/// *shapes* (NativePtrArray, VitalStruct, the component-map walk, etc.) are a reasonable engine
/// lineage starting point, but the numeric offsets below are almost certainly wrong for PoE2.
/// Re-discover and re-validate each one against a live PoE2 client (see <c>POE2Radar.Research</c>
/// and the offset workflow in CLAUDE.md) before trusting it.</para>
///
/// Naming convention: nested static class per game struct, constants as the bare offset (in hex).
/// Markers: <c>// unverified</c> = not yet checked against PoE2; <c>// PoE1✓</c> = was validated on
/// PoE1 but still needs PoE2 confirmation; <c>// ✓</c> = validated against live PoE2.
/// </summary>
public static class KnownOffsets
{
    // â”€â”€ Top-level chain â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class IngameData
    {
        public const int CurrentArea         = 0xA8;   // âœ“ pointer
        public const int CurrentAreaLevel    = 0xCC;   // âœ“ byte
        public const int CurrentAreaHash     = 0x10C;  // âœ“ uint
        public const int IngameStatePtr      = 0x2A8;  // âœ“ pointer (validated via roundtrip)
        public const int ServerData          = 0x8E0;  // âœ“ pointer
        public const int LocalPlayer         = 0x8E8;  // âœ“ pointer
        public const int EntityList          = 0x9A0;  // âœ“ pointer
        public const int EntitiesCount       = 0x9A8;  // âœ“ int
        // Terrain data
        public const int Terrain             = 0xB68;  // unverified â€” TerrainData pointer
        public const int TgtArray            = 0xB90;  // ✓ validated 2026-05-06 — NativePtrArray of TileStructure[56]; count = (last-first)/56. (Community table had 0xBB0; wrong.)
        // NumTileIndexCols/Rows are in the TerrainData struct but at unverified offsets;
        // TileMapView derives them from TgtArray count + cellsPerRow instead, so we don't
        // need to chase those offsets to ship landmark detection.
        public const int RawPathfindingData  = 0xC38;  // validated packed 4-bit grid, NativePtrArray shape
        public const int RawTerrainTargetingData = 0xC50; // validated packed 4-bit grid, NativePtrArray shape
        public const int TerrainBytesPerRow  = 0xC68;  // OK Int32 — packed 4-bit terrain bytes per row; cellsPerRow = value × 2
        // Environment
        public const int EnvironmentDataPtr  = 0x1088; // unverified
        public const int EffectEnvironments  = 0x8B0;  // unverified â€” StdVector
        public const int MapStats            = 0x120;  // unverified â€” NativePtrArray
        public const int MapStatsVisible     = 0x148;  // unverified â€” NativePtrArray
    }

    /// <summary>
    /// <c>TheGame</c> root object — parent of <c>IngameState</c>, <c>LoadingState</c>,
    /// <c>LoginState</c>, etc. Validated 2026-05-07.
    ///
    /// <para>The bot uses TheGame to gate reads that depend on "are we actually in a
    /// loaded zone." During loading screens / character select / login, IngameState's
    /// fields hold stale values; reading them before <c>CurrentStatePtr == IngameStatePtr</c>
    /// produces garbage decisions.</para>
    ///
    /// <para><b>Finding TheGame at runtime:</b> not reachable via offset from IngameState
    /// (no back-pointer). Needs an AOB scan against a PoE.exe global pointer slot, same
    /// shape as <c>AobPatterns.IngameStateRefs</c>. Pattern not yet committed — see
    /// <c>--discover-thegame</c> (TODO).</para>
    /// </summary>
    public static class TheGame
    {
        public const int CurrentStatePtr = 0x008;  // ✓ pointer to whichever state is active right now
        // State slots: 12 entries at +0x48 .. +0xF8 with 0x10 spacing (StateInternalStructure 16 bytes).
        // The state pointer lives at the slot's start (8 bytes), then the state's name/enum at +0x8.
        public const int LoadingState    = 0x048;  // ✓ AreaLoadingState pointer (State0 slot)
        public const int IngameState     = 0x088;  // ✓ IngameState pointer (State4 slot)
        public const int LoginState      = 0x0A8;  // ✓ LoginState pointer (State6 slot)
        public const int StateSlot0      = 0x048;
        public const int StateSlotStride = 0x010;
        public const int StateSlotCount  = 12;
    }

    public static class IngameState
    {
        public const int Data                = 0x218;  // âœ“ pointer â†’ IngameData
        public const int Camera              = 0x270;  // âœ“ pointer
        public const int EntityLabelMap      = 0x298;  // âœ“ pointer
        public const int UIRoot              = 0x518;  // âœ“ pointer
        public const int UIHover             = 0x590;  // âœ“ pointer
        public const int UIHoverElement      = 0x550;  // unverified
        public const int IngameUi            = 0x8F0;  // âœ“ pointer
        public const int MouseGlobal         = 0x5B8;  // unverified â€” Vector2i
        public const int MouseInGame         = 0x5CC;  // unverified â€” Vector2
        public const int TimeInGameF         = 0x8AC;  // unverified â€” float
        public const int FocusedInputElementPtr = 0x528; // unverified
    }

    // â”€â”€ Entity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class Entity
    {
        public const int EntityDetailsPtr    = 0x8;    // âœ“ ObjectHeader
        public const int ComponentList       = 0x10;   // âœ“ StdVector
        public const int Id                  = 0x88;   // âœ“ UInt32
        public const int Flags               = 0x8C;   // unverified â€” EntityFlags
    }

    public static class ObjectHeader
    {
        public const int MainObject          = 0x0;    // âœ“
        public const int Name                = 0x8;    // âœ“
        public const int ComponentLookUpPtr  = 0x28;   // âœ“
    }

    public static class PathEntity
    {
        // Source: old ExileApi GameOffsets/PathEntityOffsets.cs. Used only as a
        // best-effort identity hint until validated across more entity samples.
        public const int PathPtr             = 0x10;   // unverified â€” UTF-16 pointer
        public const int Length              = 0x20;   // unverified â€” Int64 char count
    }

    public static class ComponentLookUp
    {
        public const int ComponentPrototypeArray = 0x10; // âœ“ StdVector
        public const int ComponentArray          = 0x28; // âœ“ StdVector
        public const int Capacity                = 0x48; // unverified
        public const int Count                   = 0x50; // unverified
    }

    // â”€â”€ Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class LifeComponent
    {
        // PoE2 (GameHelper2 Life.cs): ComponentHeader{StaticPtr@0,EntityPtr@0x8}; Health@0x1A8, Mana@0x1F8, ES@0x230.
        public const int Owner               = 0x8;    // PoE1✓ ComponentHeader.EntityPtr (same in PoE2)
        public const int Health              = 0x1A8;  // PoE2 (GameHelper2) — was PoE1 0x178
        public const int Mana                = 0x1F8;  // PoE2 (GameHelper2) — was PoE1 0x1C8
        public const int EnergyShield        = 0x230;  // PoE2 (GameHelper2) — was PoE1 0x210
    }

    public static class Vital
    {
        public const int ReservedFlat        = 0x10;   // âœ“
        public const int ReservedFraction    = 0x14;   // âœ“
        public const int Regen               = 0x28;   // âœ“
        public const int Max                 = 0x2C;   // âœ“
        public const int Current             = 0x30;   // âœ“
    }

    public static class PositionedComponent
    {
        public const int OwnerAddress        = 0x8;    // âœ“
        public const int Reaction            = 0x1E0;  // unverified â€” Byte
        public const int Size                = 0x1E5;  // unverified â€” Int32
        public const int GridPosition        = 0x294;  // âœ“ Vector2i
        public const int Rotation            = 0x29C;  // âœ“ float
        public const int Scale               = 0x2B0;  // âœ“ float
        public const int WorldPosition       = 0x2B8;  // âœ“ Vector2
        public const int SpeedReverseFactor  = 0x23C;  // unverified
        public const int PrevPosition        = 0x244;  // unverified â€” Vector2
        public const int TravelStart         = 0x250;  // unverified â€” Vector2
        public const int TravelOffset        = 0x268;  // unverified â€” Vector2
        public const int TravelProgress      = 0x284;  // unverified â€” float
        public const int RawVelocity         = 0x208;  // unverified â€” Vector2i
    }

    public static class PathfindingComponent
    {
        // Source: ExileApi GameOffsets/PathfindingComponentOffsets.cs.
        // Target/previous/wanted offsets from the old source are stale on the
        // 2026-05-04 build. Remap them with a live moving-monster sample.
        public const int TargetMovePos       = 0x28;   // stale - Vector2i
        public const int PreviousMovePos     = 0x30;   // stale - Vector2i
        public const int PathingNodes        = 0x0D4;  // âœ“ inline Vector2i[count], stored reverse of POEMCP order
        public const int DestinationNodes    = 0x518;  // âœ“ int
        public const int IsMoving            = 0x54C;  // âœ“ byte, non-zero when moving
        public const int WantMoveToPosition  = 0x550;  // âœ“ Vector2i
        public const int StayTime            = 0x55C;  // âœ“ float
    }

    public static class RenderComponent
    {
        public const int Pos                 = 0x120;  // âœ“ Vector3
        public const int Bounds              = 0x12C;  // âœ“ Vector3
        public const int Name                = 0x148;  // âœ“ NativeUtf16Text
        public const int Rotation            = 0x168;  // unverified â€” Vector3
        public const int Height              = 0x184;  // unverified â€” float
    }

    public static class ActorComponent
    {
        public const int AnimationControllerPtr = 0x1A0; // unverified
        public const int ActionPtr              = 0x1B0; // unverified
        public const int ActionId               = 0x218; // unverified â€” Int16
        public const int AnimationId            = 0x248; // unverified â€” Int32
        public const int ActorSkillsArray       = 0x6F0; // unverified â€” NativePtrArray
        public const int ActorSkillsCooldownArray = 0x708; // ✓ validated 2026-05-07 — NativePtrArray of ActorSkillCooldown
        public const int ActorVaalSkills        = 0x720; // unverified â€” NativePtrArray
        public const int DeployedObjectArray    = 0x740; // unverified â€” StdVector
    }

    public static class ActorSkill
    {
        public const int SkillUseStage      = 0x8;    // unverified â€” Byte
        public const int CastType           = 0xC;    // unverified â€” Byte
        public const int SubData            = 0x10;   // unverified â€” SubActorSkillOffsets
        public const int Id                 = 0x50;   // ✓ validated 2026-05-07 — UInt16 (gem id; matches ActorSkillCooldown.SkillId)
    }

    public static class ActorSkillCooldown
    {
        public const int SkillSubId         = 0x8;    // unverified â€” Int32
        public const int Cooldowns          = 0x10;   // unverified â€” StdVector
        public const int MaxUses            = 0x30;   // unverified â€” Int32
        public const int SkillId            = 0x3C;   // unverified â€” UInt16
    }

    public static class ActorDeployedObject
    {
        public const int EntityId           = 0x0;    // unverified â€” UInt32
        public const int SkillId            = 0x4;    // unverified â€” UInt16
        public const int ObjectType         = 0x8;    // unverified â€” UInt16
    }

    public static class AnimationController
    {
        public const int ActiveAnimationsArrayPtr  = 0x18;   // unverified â€” NativePtrArray
        public const int ActorAnimationArrayPtr    = 0x180;  // unverified
        public const int AnimationInActorId        = 0x190;  // unverified â€” Int32
        public const int AnimationProgress         = 0x1A4;  // unverified â€” float
        public const int CurrentAnimationStage     = 0x1A8;  // unverified â€” Int32
        public const int NextAnimationPoint        = 0x1AC;  // unverified â€” float
        public const int AnimationSpeedMultiplier1 = 0x1B0;  // unverified â€” float
        public const int MaxAnimationProgressOffset = 0x1B8; // unverified â€” float
        public const int MaxAnimationProgress      = 0x1BC;  // unverified â€” float
        public const int AnimationSpeedMultiplier2 = 0x1F8;  // unverified â€” float
    }

    public static class ActionWrapper
    {
        public const int Skill              = 0xF8;   // unverified â€” Int64
        public const int Target             = 0x128;  // unverified â€” Int64
        public const int Destination        = 0x130;  // unverified â€” Vector2i
    }

    public static class BuffsComponent
    {
        public const int Buffs              = 0x160;  // unverified â€” NativePtrArray
    }

    public static class Buff
    {
        public const int BuffDatPtr         = 0x8;    // unverified
        public const int MaxTime            = 0x18;   // unverified â€” float
        public const int Timer              = 0x1C;   // unverified â€” float
        public const int SourceEntityId     = 0x28;   // unverified â€” UInt32
        public const int Charges            = 0x40;   // unverified â€” UInt16
        public const int FlaskSlot          = 0x42;   // unverified â€” UInt16
        public const int SourceSkillId      = 0x48;   // unverified â€” UInt16
        public const int SourceSkillId2     = 0x4A;   // unverified â€” UInt16
    }

    // â”€â”€ Components sourced from ExileApi source (ComponentHeader-adjusted where noted) â”€
    // The ExileApi open-source repo (7 years old) uses a ComponentHeader prefix (0x10 bytes)
    // in its Components/*.cs structs. Our reader resolves component addresses directly from
    // the entity's component array, which skips the header. Offsets below have been adjusted
    // (-0x10) where the source used ComponentHeader-prefixed structs.
    //
    // Where our POEMCP-validated offsets disagree with ExileApi, POEMCP wins.

    // PlayerComponent: POEMCP-validated offsets take precedence over ExileApi source.
    // Validated PlayerName=0x168, Level=0x1AC â€” see ComponentFieldTests.

    public static class PlayerComponent
    {
        // Validated 2026-05-05 by ComponentFieldTests against POEMCP.
        public const int PlayerName = 0x168;  // ✓ NativeString (UTF-16, length-prefixed)
        public const int Level      = 0x1AC;  // ✓ Byte
    }

    public static class StateMachineComponent
    {
        // Source: ExileApi Core/PoEMemory/Components/StateMachine.cs
        // These are raw reads from component Address without any struct prefix.
        public const int CanBeTarget         = 0xA0;  // unverified â€” byte
        public const int InTarget            = 0xA2;  // unverified â€” byte

        /// <summary>
        /// Pointer to the state-values array — N consecutive int64 values, one per state
        /// defined for the entity in PoE's StatesFile.dat. Read N values starting at
        /// <c>*(smAddr + StatesPtr) + i*8</c>. Validated 2026-05-08 against POEMCP across 20+
        /// StateMachine entities (BlightPump, BlightPathway, MultiplexPortal) — every one
        /// matched the value list exposed by ExileCore's <c>sm.States[i].Value</c>.
        ///
        /// <para>The state NAMES live in PoE's data files, not in this component, so the
        /// caller must know the index → name mapping for the entity type it's reading.
        /// E.g. BlightPump states are indexed 0=ready_to_build, 1=health, 2=ui_description,
        /// 3=next_path, 4=activated, 5=success, 6=fail, 7=build_step, 8=ready_to_start.</para>
        /// </summary>
        public const int StatesPtr           = 0x160; // ✓ Int64 — points to int64[] of values
    }

    public static class StatsComponent
    {
        // Source: ExileApi GameOffsets/StatsComponentOffsets.cs + Components/Stats.cs (adjusted -0x10).
        public const int Owner              = 0x8;    // unverified â€” Int64
        public const int Stats              = 0x88;   // unverified â€” NativePtrArray (was 0x98)
    }

    public static class ModsComponent
    {
        // Source: ExileApi GameOffsets/ModsComponentOffsets.cs (no header â€” direct offsets).
        public const int HumanStats         = 0x20;   // unverified â€” static readonly
        public const int UniqueName         = 0x30;   // unverified â€” Int64
        public const int Identified         = 0xB0;   // OK bool — InventoryItemComponentsOracleTest 2026-05-05
        public const int ItemRarity         = 0xB4;   // OK int — InventoryItemComponentsOracleTest 2026-05-05
        public const int ItemMods           = 0x180;  // OK NativePtrArray (combined impl+expl+crafted+...) — InventoryItemComponentsOracleTest 2026-05-05
        // ExplicitMods/ImplicitMods are NOT separate memory fields — ExileCore filters ItemMods by mod type. Walk ItemMods and inspect each mod struct.
        public const int GetImplicitStats   = 0x170;  // unverified â€” NativePtrArray
        public const int GetStats           = 0x1A0;  // unverified â€” NativePtrArray
        public const int GetCraftedStats    = 0x1B8;  // unverified â€” NativePtrArray
        public const int GetFracturedStats  = 0x1D0;  // unverified â€” NativePtrArray
        public const int IsUsable           = 0x370;  // unverified â€” byte
        public const int IsMirrored         = 0x371;  // unverified â€” byte
        public const int ItemLevel          = 0x248;   // OK int — InventoryItemComponentsOracleTest 2026-05-05 (wide scan)
        public const int RequiredLevel      = 0x24C;   // unverified — int (paired with ItemLevel)
    }

    public static class TargetableComponent
    {
        // Source: ExileApi GameOffsets/TargetableComponentOffsets.cs (no header â€” direct offsets).
        public const int IsTargetable        = 0x30;  // unverified â€” bool
        public const int IsTargeted          = 0x32;  // unverified â€” bool
    }

    public static class ObjectMagicPropertiesComponent
    {
        // OK Int32 — validated 2026-05-05 via POEMCP probe on a Rare Revenant. The decompiled
        // GameOffsets reference is obfuscated (literal offset 0x7F4A7E6A is a scramble), so
        // we can't lift it from there; old ExileApi's 0x7C is stale on the current PoE build.
        public const int Rarity              = 0x144;
        public const int Mods                = 0x98;  // unverified — NativePtrArray
    }

    public static class WorldItemComponent
    {
        // Source: ExileApi Components/WorldItem.cs (adjusted -0x10).
        public const int ItemPtr            = 0x28;   // OK Entity ptr — validated 2026-05-05 via POEMCP scan; was 0x18 (wrong)
        public const int LootAllocationId   = 0x20;   // unverified â€” int (was 0x30)
        public const int LootAllocationTime = 0x24;   // unverified â€” uint (was 0x34)
        public const int DroppedTime        = 0x28;   // unverified â€” int (was 0x38)
    }

    public static class StackComponent
    {
        // Source: ExileApi Components/Stack.cs (adjusted -0x10).
        public const int StackInternalPtr   = 0x10;   // unverified — Int64 (revert -0x10 adjustment)
        public const int CurrentCount       = 0x18;   // OK int — InventoryItemComponentsOracleTest 2026-05-05
    }

    public static class QualityComponent
    {
        // Source: ExileApi Components/Quality.cs (adjusted -0x10).
        public const int CurrentQuality     = 0x18;   // unverified — int (revert -0x10 adjustment)
    }

    public static class SkillGemComponent
    {
        // Source: ExileApi Components/SkillGem.cs (adjusted -0x10).
        public const int SkillGemInternalPtr = 0x10;  // unverified â€” Int64 (was 0x20)
        public const int TotalExpGained      = 0x18;  // unverified â€” uint (was 0x28)
        public const int Level               = 0x1C;  // unverified â€” uint (was 0x2C)
        public const int ExperiencePrevLevel = 0x20;  // unverified â€” uint (was 0x30)
        public const int ExperienceMaxLevel  = 0x24;  // unverified â€” uint (was 0x34)
    }

    public static class RenderItemComponent
    {
        // Source: ExileApi Components/RenderItem.cs (adjusted -0x10).
        public const int ResourcePath       = 0x10;   // unverified â€” NativeUnicodeText (was 0x20)
    }

    // â”€â”€ IngameUi panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Source: ExileApi GameOffsets/IngameUElementsOffsets.cs
    // These are offsets within the IngameUi object (the thing at IngameState.IngameUi).

    /// <summary>
    /// Map device interaction panel.
    ///
    /// <para><b>Slot rects come from live Element reads — never hardcode window-relative
    /// offsets.</b> The panel and its children move together when the user pans the atlas,
    /// switches resolution, opens the inventory beside the device, etc. Use
    /// <c>ElementGeometry.TryReadRect</c> (the same parent-walk we use for inventory/stash)
    /// on each child element. The constants below are CHILD POINTER offsets within the
    /// panel struct, not screen positions.</para>
    ///
    /// <para><b>Finding the panel address.</b> The panel itself is NOT reachable via a
    /// stable offset from <see cref="IngameUi"/> — ExileApi walks the UI tree to find it.
    /// For the bot, the simplest reliable approach is: after clicking the in-world map
    /// device entity, walk <c>UIRoot.Children</c> looking for the unique signature (a
    /// 9-child element whose child[3] is a labeled "Activate" button). Cache the address
    /// for the session.</para>
    /// </summary>
    public static class MapDeviceWindow
    {
        // Validated 2026-05-07 against an open map device.
        public const int ActivateButtonChildIndex = 3;     // ✓ MapDeviceWindow.Children[3] = Activate button
        public const int ActivateButtonPtr        = 0xE0;  // ✓ direct pointer (alias at +0x118)

        // Number of scarab slots PoE exposes. Real scarabs sit at ScarabSlots[1..5];
        // ScarabSlots[0] in ExileApi's collection IS the map slot (duplicated alias —
        // skip index 0 when iterating scarabs only).
        public const int ScarabSlotCount = 5;
    }

    public static class IngameUiElements
    {
        public const int GameUI                    = 0x320; // validated pointer
        public const int Mouse                     = 0x470; // unverified â€” Cursor
        public const int SkillBar                  = 0x478; // validated pointer
        public const int HiddenSkillBar            = 0x458; // validated pointer
        public const int PartyElement              = 0x488; // validated pointer
        public const int ChatBox                   = 0x528; // validated pointer
        public const int MapSideUI                 = 0x548; // validated pointer
        public const int QuestTracker              = 0x558; // validated pointer
        public const int OpenLeftPanel             = 0x5E0; // validated pointer
        public const int OpenRightPanel            = 0x5E8; // validated pointer
        public const int InventoryPanel            = 0x610; // validated pointer
        public const int StashElement              = 0x618; // validated pointer
        public const int GuildStashElement         = 0x620; // validated pointer
        public const int OfflineMerchantPanel      = 0x628; // validated pointer
        public const int TreePanel                 = 0x638; // validated pointer
        public const int AtlasPanel                = 0x648; // validated pointer
        public const int WorldMap                  = 0x680; // validated pointer
        public const int Map                       = 0x6C8; // validated pointer
        public const int ItemsOnGroundLabelRoot    = 0x6D0; // validated pointer
        public const int NpcDialog                 = 0x780; // validated pointer
        public const int PurchaseWindow            = 0x7A0; // validated pointer
        public const int SellWindow                = 0x7B0; // validated pointer
        public const int TradeWindow               = 0x7B8; // validated pointer
        public const int MapReceptacleWindow       = 0x7C0; // validated pointer
        public const int LabyrinthDivineFontPanel  = 0x7C8; // validated pointer
        public const int IncursionWindow           = 0x820; // validated pointer
        public const int DelveWindow               = 0x840; // validated pointer
        public const int BetrayalWindow            = 0x858; // validated pointer
        public const int ZanaMissionChoice         = 0x850; // validated pointer
        public const int CraftBenchWindow          = 0x868; // validated pointer
        public const int UnveilWindow              = 0x870; // validated pointer
        public const int MetamorphWindow           = 0x870; // validated pointer alias
        public const int HeistWindow               = 0x8A0; // validated pointer
        public const int BlueprintWindow           = 0x8A8; // validated pointer
        public const int HeistLockerElement        = 0x8C0; // validated pointer
        public const int RitualWindow              = 0x8C8; // validated pointer
        public const int UltimatumPanel            = 0x8D8; // validated pointer
        public const int ExpeditionWindow          = 0x8E0; // validated pointer
        public const int ExpeditionLockerElement   = 0x8F0; // validated pointer
        public const int SanctumFloorWindow        = 0x920; // validated pointer
        public const int SanctumRewardWindow       = 0x930; // validated pointer
        public const int NecropolisMonsterPanel    = 0x978; // validated pointer
        public const int VillageRecruitmentPanel   = 0x998; // validated pointer
        public const int VillageRewardWindow       = 0x9A0; // validated pointer
        public const int VillageShipmentScreen     = 0x9A8; // validated pointer
        public const int VillageWorkerManagementPanel = 0x9E0; // validated pointer
        public const int VillageScreen             = 0x9E8; // validated pointer
        public const int MercenaryEncounterWindow  = 0x9F8; // validated pointer
        public const int GenesisTreeWindow         = 0xA08; // validated pointer
        public const int CurrencyExchangePanel     = 0xA18; // validated pointer
        public const int AreaInstanceUi            = 0xA60; // validated pointer
        public const int ItemRightClickPriceMenu   = 0xA90; // validated pointer
        public const int CurrencyShiftClickMenu    = 0xA98; // validated pointer
        public const int AsyncItemRightClickPriceMenu = 0xAA0; // validated pointer
        public const int PopUpWindow               = 0xAB0; // validated pointer
        public const int InstanceManagerPanel      = 0xAB8; // validated pointer
        public const int ResurrectPanel            = 0xB18; // validated pointer
        public const int LeagueMechanicButtons     = 0xB30; // validated pointer
        public const int ExpeditionDetonatorElement = 0xB78; // validated pointer
        public const int InvitesPanel              = 0xBB0; // validated pointer
        public const int GemLvlUpPanel             = 0xC00; // validated pointer
        public const int BlightEncounterUi         = 0xC38; // validated pointer
        // Container holding the "return to area" boundary warning for Ultimatum (and likely
        // other arena mechanics). Validated 2026-05-18: matches IngameUi.Children[25] exactly.
        // The warning element is reached via Children[4].Children[0].Children[8] from here;
        // its IsVisible flips true when the player crosses outside the encounter boundary.
        public const int AreaBoundaryWarningParent = 0x758;
        public const int ItemOnGroundTooltip       = 0xD40; // validated pointer

        // Current ExileCore exposes MapDeviceWindow by walking AtlasPanel children:
        // IngameUi.AtlasPanel.Children[7].Children[0].
        public const int MapDeviceWindowAtlasPanelChildIndex = 7;
        public const int MapDeviceWindowChildIndex           = 0;
    }

    public static class MapPanel
    {
        // Within IngameUi.Map (the parent at IngameUiElements.Map). LargeMap is the M-key full-zone map;
        // SmallMiniMap is the corner minimap. Discovered 2026-05-05 via child-walk + pointer scan.
        public const int LargeMap     = 0x320; // OK pointer to SubMap (large map element)
        public const int SmallMiniMap = 0x328; // OK pointer to SubMap (corner minimap)
    }

    public static class SubMap
    {
        // SubMap inherits Element. MapScale and MapCenter are derived in ExileCore code; we
        // compute them ourselves from Zoom/Shift/DefaultShift + window dimensions.
        public const int Zoom           = 0x354; // OK float — decompiled MapSubElement.MapZoom
        public const int Shift          = 0x310; // OK Vector2 — user pan offset (MapSubElement.MapShift)
        public const int DefaultShift   = 0x318; // OK Vector2 — built-in offset (MapSubElement.DefaultMapShift)

        // Empirically derived 2026-05-05 from POEMCP probe at 1920×1080 / Zoom=0.5:
        //   ExileCore.MapScale = 0.7976366; matches Zoom × WindowHeight / 677.0.
        // The 677.0 is constant across resolutions per ExileCore's internal computation.
        public const float MapScaleHeightDivisor = 677.0f;
    }

    // â”€â”€ Server-side data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class ServerData
    {
        // Offsets validated 2026-05-04 via --find-serverdata-offsets scan against live PoE.
        // Community offsets in docs were shifted by +0x8000; these are corrected.
        public const int Latency            = 0xBD38; // âœ“ Int32
        public const int TimeInGame         = 0xBDE8; // unverified Int32 (sanity-OK, no POEMCP equivalent)
        public const int League             = 0xBDC8; // âœ“ NativeUtf16Text
        public const int PlayerStashTabs    = 0xBE98; // âœ“ pointer vector (community 0x3E98 + 0x8000)
        public const int GuildStashTabs     = 0xBEB0; // unverified â€” StdVector
        public const int InstanceId         = 0xBC80; // unverified â€” Int32
        public const int PlayerRelatedData  = 0xBCE8; // unverified
        public const int Gold               = 0xBE0C; // âœ“ Int32
        public const int SkillBarIds        = 0xC1D8; // âœ“ 13 x UInt16
        public const int PlayerInventories  = 0xC3F8; // âœ“ StdVector<InventoryHolder> (0x18-byte elements)
        public const int PlayerInventoryElementSize = 0x18;
        public const int NearestPlayers     = 0xC248; // unverified â€” NativePtrArray
        public const int EntityEffects      = 0x1CB8; // validated vector count (not skip-adjusted)
        public const int MinimapIcons       = 0xC278; // validated vector count
        public const int MechanicHandlers   = 0xC9D8; // validated vector count
        public const int CurrentParty       = 0xC118; // unverified â€” StdVector
        public const int TradeChatChannel   = 0xC8F0; // unverified â€” UInt16
        public const int GlobalChatChannel  = 0xC8F8; // unverified â€” UInt16
        public const int CompletedMapsCount = 0xCB60; // unverified â€” Int32
        public const int WorldMousePosition = 0xC1F4; // unverified â€” Vector2
        public const int MonsterLevel       = 0xD1C4; // âœ“ Byte
        public const int MonstersRemaining  = 0xD1C5; // âœ“ Byte
        public const int StashTabElementSize = 0x68;
    }

    public static class ServerPlayerData
    {
        public const int PassiveSkillIds            = 0x190; // unverified â€” NativePtrArray
        public const int PassiveJewelSocketIds       = 0x1D8; // unverified â€” NativePtrArray
        public const int PlayerClass                 = 0x270; // unverified â€” Byte
        public const int CharacterLevel              = 0x274; // unverified â€” Int32
        public const int PassiveRefundPointsLeft     = 0x278; // unverified â€” Int32
        public const int QuestPassiveSkillPoints     = 0x27C; // unverified â€” Int32
        public const int FreePassiveSkillPointsLeft  = 0x280; // unverified â€” Int32
        public const int TotalAscendencyPoints       = 0x284; // unverified â€” Int32
        public const int SpentAscendencyPoints       = 0x288; // unverified â€” Int32
    }

    // â”€â”€ Camera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class Camera
    {
        public const int Inner              = 0xA8;   // stale for 2026-05-04 build; points at static/module data
        public const int MatrixBytes        = 0x1E8;  // âœ“ Matrix4x4, validated by WorldToScreen projection
        public const int Position           = 0x21C;  // âœ“ Vector3
        public const int ZFar               = 0x354;  // âœ“ float
        public const int Width              = 0x318;  // âœ“ Int32
        public const int Height             = 0x31C;  // âœ“ Int32
        public const int ActualZoomLevel    = 0x4A8;  // unverified â€” float
        public const int DesiredZoomLevel   = 0x4B0;  // unverified â€” float
        public const int IsFixedCamera      = 0x4F4;  // unverified â€” Byte
        public const int IsInstantZoom      = 0x4F8;  // unverified â€” Byte
    }

    public static class CameraInner
    {
        public const int MatrixBytes        = 0x100;  // unverified â€” Matrix4x4 (64 bytes)
        public const int Position           = 0x174;  // unverified â€” Vector3
        public const int ZFar               = 0x214;  // unverified â€” float
        public const int Width              = 0x270;  // unverified â€” Int32
        public const int Height             = 0x274;  // unverified â€” Int32
    }

    // â”€â”€ UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class Element
    {
        public const int SelfPointer       = 0xB0;   // ✓ validated 2026-05-04 (UI tree oracle)
        public const int Childs            = 0xB8;   // OK NativePtrArray (UI tree oracle 2026-05-04)
        public const int ScrollOffset       = 0x130;  // unverified â€” Vector2
        public const int CursorInfo         = 0x140;  // unverified
        public const int Position           = 0x148;  // OK Vector2 (UI tree oracle 2026-05-04)
        public const int Root               = 0x160;  // unverified
        public const int LabelTextSize      = 0x188;  // unverified â€” Byte
        public const int Scale              = 0x18C;  // OK float (UI tree oracle 2026-05-04)
        public const int Type               = 0x1C8;  // unverified â€” UInt16
        public const int Parent             = 0x1D0;  // ✓ validated 2026-05-04 (parent-chain oracle, 3 levels)
        public const int Flags              = 0x1D8;  // OK UInt32 ElementFlags (UI tree oracle 2026-05-04)
        public const int Tooltip            = 0x1E8;  // unverified
        public const int Size               = 0x258;  // OK Vector2 (UI tree oracle 2026-05-04)
        public const int LabelBackgroundColor = 0x278; // unverified â€” ColorBGRA
        public const int LabelTextColor     = 0x27C;  // unverified â€” ColorBGRA
        public const int LabelBorderColor   = 0x280;  // unverified â€” ColorBGRA
        public const int ShinyHighlightState = 0x294; // unverified â€” Byte
        public const int Text               = 0x380;  // unverified â€” NativeUtf16Text
        public const int TextureNamePtr     = 0x328;  // unverified
        public const int TextNoTags         = 0x4A8;  // unverified â€” NativeUtf16Text
    }

    // â”€â”€ Item components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class ItemsOnGroundLabelElement
    {
        public const int LabelOnHover        = 0x248; // unverified - pointer
        public const int ItemOnHover         = 0x250; // unverified - pointer
        public const int CountLabels         = 0x268; // unverified - int
        public const int LabelsListSentinel  = 0x4F0; // validated - pointer to intrusive list sentinel
        public const int CountLabels2        = 0x2A8; // unverified - int
    }

    public static class LabelOnGround
    {
        public const int ItemOnGround        = 0x18;  // validated - Entity pointer
        public const int Label               = 0x10;  // validated - Element pointer
    }

    public static class InventoryElement
    {
        public const int AllInventories       = 0x3F0; // validated inline inventory pointer array
        public const int PlayerInventoryIndex = 19;
    }

    public static class Inventory
    {
        public const int HoverItem            = 0x2F8; // unverified pointer
        public const int FakePos              = 0x300; // unverified Vector2i
        public const int RealPos              = 0x308; // unverified Vector2i
        public const int CursorInInventory    = 0x318; // unverified Int32
        public const int ItemCount            = 0x480; // validated Int64
        public const int ServerInventoryId    = 0x5B0; // unverified Int32
        public const int InventorySize        = 0x5D8; // validated Vector2i
    }

    public static class NormalInventoryItem
    {
        public const int Item                 = 0x410; // validated Entity pointer
        public const int Width                = 0x4B4; // validated Int32
        public const int Height               = 0x4B8; // validated Int32
    }

    /// <summary>
    /// One entry in <c>IngameState.Data.ServerData.PlayerInventories</c> (StdVector with
    /// 0x18-byte elements). One holder per equipment/inventory slot (MainInventory, BodyArmour,
    /// Weapon1, Helm1, Ring1, Ring2, ..., 5x flask, 5x map, jewels, etc.).
    /// Discovered 2026-05-05 by ServerInventoryLayoutDiscoveryTest.
    /// </summary>
    public static class InventoryHolder
    {
        public const int Id                   = 0x00; // OK Int32 — slot id (1-30)
        public const int InventoryPtr         = 0x08; // OK pointer to ServerInventory
        public const int Size                 = 0x18; // element stride in PlayerInventories vector
    }

    /// <summary>
    /// The ServerInventory object pointed at by an InventoryHolder. Holds the actual item
    /// list for an equipment/inventory slot.
    /// Discovered 2026-05-05 by ServerInventoryLayoutDiscoveryTest.
    /// </summary>
    public static class ServerInventory
    {
        public const int InventType           = 0x140; // OK Int32 (InventoryTypeE enum)
        public const int InventSlot           = 0x144; // OK Int32 (InventorySlotE enum) — sits adjacent
        public const int Columns              = 0x14C; // OK Int32
        public const int Rows                 = 0x150; // OK Int32
        public const int ItemCount            = 0x190; // OK Int64

        // Items list: stored as a hash map of InventSlotItem records (POEMCP exposes
        // ServerInventory.ReadHashMap). The flat StdVector pattern doesn't apply here —
        // walking equipment items via memory needs the hash-map structure mapped, which is
        // deferred. For visible inventory items we walk the Inventory UI element children
        // instead (see InventoryReader).
        // public const int InventorySlotItemsHashRoot = ?;   // TODO
    }

    public static class BaseComponent
    {
        public const int ItemInfo           = 0x10;   // unverified
        public const int CurrencyItemLevel  = 0xC5;   // unverified â€” Byte
        public const int Influence           = 0xC6;   // unverified â€” Byte
        public const int Corrupted           = 0xC7;   // unverified â€” Byte
        public const int PublicPrice         = 0x60;   // unverified â€” NativeUtf16Text
        public const int UnspentAbsorbedCorruption = 0xC8; // unverified â€” Int32
        public const int ScourgedTier        = 0xCC;   // unverified â€” Int32
    }

    public static class SocketsComponent
    {
        public const int Sockets            = 0x28;   // OK SocketColorList — InventoryItemComponentsOracleTest 2026-05-05
        public const int LinkSizes          = 0x40;   // unverified — StdVector (shifted +0x18)
        public const int SocketedGems       = 0x60;   // unverified — SocketedGemList (shifted +0x18)
    }

    public static class AreaTransitionComponent
    {
        public const int AreaId             = 0xA8;   // unverified â€” UInt16
        public const int TransitionType     = 0xB2;   // unverified â€” Byte
        public const int WorldAreaInfoPtr    = 0x148;  // unverified
    }

    public static class ChestComponent
    {
        public const int StrongboxData      = 0x160;  // unverified
        public const int IsOpened           = 0x168;  // unverified â€” Byte
        public const int IsLocked           = 0x169;  // unverified â€” Byte
        public const int Quality            = 0x16C;  // unverified â€” Byte
        public const int IsStrongbox        = 0x1A8;  // unverified â€” Byte
    }

    // â”€â”€ Entity list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class EntityList
    {
        public const int FirstAddr          = 0x0;    // unverified
        public const int Root               = 0x8;    // unverified â€” ExileApi traversal reads *(EntityList+0x8)
        public const int SecondAddr         = 0x10;   // unverified
        public const int IsEmpty            = 0x19;   // unverified â€” Byte
        public const int Entity             = 0x28;   // unverified
    }

    // â”€â”€ Area / loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class AreaLoadingState
    {
        public const int IsLoading              = 0x348;  // unverified â€” Int64
        public const int TotalLoadingScreenTimeMs = 0x704; // unverified â€” UInt32
        public const int AreaName               = 0x748;  // unverified
    }

    // â”€â”€ Misc UI panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class CurrencyExchangePanel
    {
        public const int WantedItemCountInputPtr  = 0x3C8; // unverified
        public const int WantedItemTypePtr        = 0x3D0; // unverified
        public const int MarketRateGet           = 0x470; // unverified â€” Int16
        public const int MarketRateGive          = 0x472; // unverified â€” Int16
        public const int Stock1                  = 0x430; // unverified â€” StdVector
        public const int Stock2                  = 0x448; // unverified â€” StdVector
        public const int OrderList               = 0x560; // unverified â€” StdVector
    }

    public static class Cursor
    {
        public const int Clicks             = 0x2CC;  // unverified â€” Int32
        public const int ItemTypePtr         = 0x4E0;  // unverified
        public const int ActionString        = 0x4F0;  // unverified â€” NativeUtf16Text
        public const int Action              = 0x578;  // unverified â€” Byte
    }

    public static class DiagnosticElement
    {
        public const int DiagnosticArray    = 0x0;    // unverified
        public const int X                   = 0x10;   // unverified â€” Int32
        public const int Y                   = 0x14;   // unverified â€” Int32
        public const int Width              = 0x18;   // unverified â€” Int32
        public const int Height             = 0x1C;   // unverified â€” Int32
    }

    // â”€â”€ UI panel specialization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class IngameUi
    {
        // IngameState.IngameUi pointer offsets to specialized panel pointers.
        // These are stored as fields within the IngameUi object; exact offsets need validation.
        // TODO: discover offsets via POEMCP eval on IngameState.IngameUi.
        //
        // AutoExile accesses:
        //   .StashElement, .InventoryPanel, .Atlas, .Map.LargeMap,
        //   .ItemsOnGroundLabelElement, .NpcDialog, .GemLvlUpPanel,
        //   .ResurrectPanel, .UltimatumPanel, .RitualWindow,
        //   .LabyrinthSelectPanel, .LabyrinthDivineFontPanel,
        //   .CurrencyExchangePanel, .WorldMap, .PartyElement,
        //   .AscendancySelectPanel
    }

    // â”€â”€ Entity flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public static class EntityFlags
    {
        // Entity + 0x8C is the Flags field. Known bit meanings (from ExileApi):
        public const uint IsHostile      = 0x0001;
        public const uint IsTargetable   = 0x0002;
        public const uint IsAlive        = 0x0004;
        public const uint IsValid        = 0x0008;
        public const uint IsOpened       = 0x0010; // chest/door opened
        // TODO: validate these bits against POEMCP
    }

    // â”€â”€ Entity types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public enum EntityType : byte
    {
        // Maps to ExileCore.Shared.Enums.EntityType values.
        // Only the types AutoExile actually queries are listed.
        Nothing            = 0,
        Monster            = 4,
        Chest              = 7,
        AreaTransition     = 10,
        WorldItem          = 11,
        Player             = 14,
        IngameIcon         = 20,
        TownPortal         = 22,
        Portal             = 26,
        NPC                = 30,
        Shrine             = 31,
        MiscellaneousObjects = 47,
    }

    // ── Tile data (per-zone landmark layout) ──────────────────────────────
    //
    // Each entry in IngameData.TgtArray is a 56-byte TileStructure. The bot iterates these
    // once per area to build a name → grid-position lookup. Tile size is 23×23 grid cells
    // (PoE's standard zone tile granularity); a tile at flat index i sits at grid
    //   (i % numCols * 23, i / numCols * 23)
    // where numCols is derived from cellsPerRow / 23.

    public static class TileStructure
    {
        public const int SizeBytes        = 56;     // ✓ validated via TgtArray dump (5103 entries × 56 bytes)
        public const int SubTileDetailsPtr = 0x0;   // ✓ pointer
        public const int TgtFilePtr       = 0x8;    // ✓ pointer → TgtTileStruct
        public const int EntitiesList     = 0x10;   // ✓ container
        public const int TileHeight       = 0x30;   // ✓ Int32
        public const int RotationSelector = 0x36;   // ✓ Int16
    }

    public static class TgtTileStruct
    {
        public const int TgtPath          = 0x8;    // ✓ NativeString (UTF-16 SSO) — full .tdt path
        public const int TgtDetailPtr     = 0x28;   // ✓ pointer → TgtDetailStruct
    }

    public static class TgtDetailStruct
    {
        public const int Name             = 0x0;    // ✓ NativeString (UTF-16 SSO) — semantic detail name
    }

    /// <summary>Each terrain tile spans this many grid cells per side. PoE constant.</summary>
    public const int TileGridCells = 23;
}
