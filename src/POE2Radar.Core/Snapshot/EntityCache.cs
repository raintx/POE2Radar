using POE2Radar.Core.Game;

namespace POE2Radar.Core.Snapshot;

/// <summary>
/// Per-entity-ID cache that survives across world ticks. The hot insight: most of an entity's
/// data is *frozen* for its lifetime (path, kind, rarity, component addresses). Reading those
/// every tick is wasteful — the entity walk's real cost is resolving the component map. With
/// addresses cached, refreshing a 1000-mob field is just N small struct reads per tick.
///
/// <para>Lifecycle:
/// <list type="bullet">
///   <item><b>New entity</b>: not in cache → full hydrate (path, components, rarity, initial mutables). Costs ~50 µs.</item>
///   <item><b>Surviving entity</b>: in cache → re-read mutables only via cached component addresses. Costs ~5 µs.</item>
///   <item><b>Missing entity</b>: not seen for N walks → evicted.</item>
/// </list>
/// </para>
///
/// <para>Tier-rate scheduling (Hot/Warm/Cold) is a future addition on top of this. The basic
/// cache alone gets ~5× speedup on dense maps because it eliminates per-tick component-map
/// resolution.</para>
/// </summary>
public sealed class EntityCache
{
    /// <summary>
    /// Eviction policy is now smart, not time-based. We only evict when:
    ///   • The entity is missing from the live entity list, AND
    ///   • Its cached grid position is INSIDE the network bubble (so PoE *should* be
    ///     streaming it; if it's missing in-bubble, it's genuinely gone — died, picked up,
    ///     consumed mechanic).
    /// Entities outside the bubble stay forever (until area change). That preserves
    /// "I know there's a shrine over there I haven't taken yet" across long walks.
    /// </summary>
    private const int InBubbleMissedWalksToEvict = 4;

    /// <summary>
    /// Per-entity refresh priority. Bubble + alive + (moving OR rare/unique) → Hot (every
    /// tick). In bubble + alive + idle → Warm (every 3 ticks). Outside bubble or dead →
    /// Cold (every 8 ticks). Re-evaluated on each refresh — if a Cold mob becomes Hot
    /// (player walks within range) it'll get bumped to Hot on its next due tick.
    /// </summary>
    public enum Tier { Cold, Warm, Hot }

    private const int HotIntervalTicks  = 1;   // ~30 Hz
    private const int WarmIntervalTicks = 3;   // ~10 Hz
    private const int ColdIntervalTicks = 8;   // ~3.75 Hz

    /// <summary>One cached entity. Frozen fields read once at hydrate; mutables refreshed per tick.</summary>
    public sealed class Entry
    {
        // Identity (frozen)
        public nint Address;
        public uint Id;

        // Frozen — read once on first sight
        public string                          Path = string.Empty;
        public string                          Metadata = string.Empty;
        public EntityListReader.EntityKind     Kind;
        public EntityListReader.EntityRarity?  Rarity;
        public IReadOnlyDictionary<string, nint> Components = new Dictionary<string, nint>();
        public nint LifeCompAddr;
        public nint PositionedCompAddr;
        public nint PathfindingCompAddr;
        public nint StateMachineCompAddr;
        public nint OmpCompAddr;
        public nint TargetableCompAddr;
        public nint RenderCompAddr;
        public nint ChestCompAddr;
        /// <summary>Display name from Render component (e.g. "Carius, the Unnatural"). Empty for unnamed mobs.</summary>
        public string Name = string.Empty;

        // Mutable — refreshed each world tick the entity is in scope
        public Vector2i GridPosition;
        public int      HpCurrent;
        public int      HpMax;
        public bool     IsMoving;
        public bool     IsTargetable = true;
        /// <summary>For Chest entities: true once the chest has been opened. Read from
        /// <c>Chest.IsOpened</c> (component +0x168). Note: chests stay <c>IsTargetable=true</c>
        /// after opening, so consumers must check <c>IsOpened</c> not targetable.</summary>
        public bool     IsOpened;

        // Bookkeeping
        public int  MissedWalks;
        public Tier Tier = Tier.Hot;     // start hot — first refresh forces a full read anyway
        public int  LastRefreshedTick;   // _tickCounter value at last RefreshMutable
        public DateTime LastSeenAt = DateTime.UtcNow;   // wall-clock timestamp of last successful traversal hit
        /// <summary>
        /// True when we haven't observed this entity in the live entity list for at least
        /// one walk. Cached frozen + last-known-mutable fields are preserved; consumers
        /// reading <see cref="GridPosition"/>/<see cref="HpCurrent"/> get the last-good
        /// values, not freshly-read garbage. Use this to gate "refresh from memory" vs.
        /// "trust cache" decisions.
        /// </summary>
        public bool IsStale => MissedWalks > 0;

        /// <summary>
        /// True iff PoE attached a Life component to this entity. Real monsters (hostile +
        /// friendly) all have one; effect entities (Volatile Orbs, particle markers, AoE
        /// indicators) do not. Use as a cheap, frozen-at-hydration gate when filtering for
        /// "this is a real fight target" — avoids the IsTargetable offset which is unverified
        /// across all entity types.
        /// </summary>
        public bool HasLife => LifeCompAddr != 0;

        public bool IsHostileMonster => Kind == EntityListReader.EntityKind.Monster
            && !Metadata.Contains("/AnimatedItem/", StringComparison.OrdinalIgnoreCase)
            // /Masters/ covers friendly NPCs that share Monster kind: Sister Cassia (blight),
            // Einhar, Niko, Jun, Alva, Zana, Kirac, etc. They have Monster type + Unique
            // rarity but are non-hostile and shouldn't be targeted or get a nameplate.
            && !Metadata.Contains("/Masters/", StringComparison.OrdinalIgnoreCase)
            // Blight player-side structures, all classified as Monster + Unique by PoE:
            //   - BlightFoundation: tower-build pads, ~30 per blighted map
            //   - BlightTower:      player-built towers (variants: Meteor, Empowering, etc)
            // Skipping by metadata-path is what AutoExile does (`BlightState.cs`); the
            // canonical IsHostile flag isn't at a single bit position we've located yet.
            // Hostile blight content lives under /LeagueBlight/{Generic,Fire,Lightning,
            // Physical}/* — those don't match these prefixes so they still trigger combat.
            && !Metadata.Contains("/LeagueBlight/BlightFoundation", StringComparison.OrdinalIgnoreCase)
            && !Metadata.Contains("/LeagueBlight/BlightTower",      StringComparison.OrdinalIgnoreCase);
        public bool IsAlive => HpCurrent > 0 && HpMax > 0;
    }

    private readonly MemoryReader _reader;
    private readonly Dictionary<uint, Entry> _byId = new();
    private int _tickCounter;

    public EntityCache(MemoryReader reader) { _reader = reader; }

    /// <summary>Diagnostic: per-tier entity counts.</summary>
    public (int hot, int warm, int cold, int total) TierBreakdown()
    {
        int h = 0, w = 0, c = 0;
        foreach (var e in _byId.Values)
        {
            if (e.Tier == Tier.Hot) h++;
            else if (e.Tier == Tier.Warm) w++;
            else c++;
        }
        return (h, w, c, _byId.Count);
    }

    /// <summary>All currently-known entities. Iterate from the renderer for cheap dot-list builds.</summary>
    public IReadOnlyDictionary<uint, Entry> Entries => _byId;

    /// <summary>Drop everything. Call on area transitions — old IDs may collide with new instances.</summary>
    public void Clear() => _byId.Clear();

    /// <summary>
    /// Walk the live entity tree, hydrate new entities, refresh mutable fields per tier,
    /// evict entries that disappeared. Call once per world tick.
    ///
    /// <para><paramref name="playerGrid"/> drives tier classification — entities outside
    /// the network bubble fall to Cold and only refresh every 8 ticks.</para>
    /// </summary>
    public void Refresh(nint entityListAddress, Vector2i playerGrid)
    {
        if (entityListAddress == 0) return;
        _tickCounter++;

        var traversal = EntityListReader.EnumerateEntityAddresses(_reader, entityListAddress, maxNodes: 5000);

        foreach (var entry in _byId.Values) entry.MissedWalks++;

        foreach (var addr in traversal.EntityAddresses)
        {
            // Just the ID — one tiny read per entity per tick. Discovery is unconditional;
            // mutable refresh is rate-limited per tier.
            if (!_reader.TryReadStruct<uint>(addr + KnownOffsets.Entity.Id, out var id) || id == 0) continue;

            if (!_byId.TryGetValue(id, out var entry))
            {
                entry = TryHydrate(addr, id);
                if (entry is null) continue;
                _byId[id] = entry;
            }
            else if (entry.Address != addr)
            {
                // Same ID at a new address — likely respawn/relocation. Re-hydrate.
                var fresh = TryHydrate(addr, id);
                if (fresh is null) continue;
                _byId[id] = fresh;
                entry = fresh;
            }

            // Returning-to-range cleanup: if this entry was stale and we just saw it again,
            // refresh aggressively (force the dueInterval gate by zeroing LastRefreshedTick).
            // PoE may have updated HP / position / state-machine while we weren't watching;
            // a full re-read corrects any drift before the consumer touches it.
            var wasStale = entry.MissedWalks > 0;
            entry.MissedWalks = 0;
            entry.LastSeenAt = DateTime.UtcNow;
            if (wasStale) entry.LastRefreshedTick = 0;  // force refresh this tick

            // Tier-rate refresh. Each entity has its own due cadence — Hot mobs refresh
            // every tick, Cold mobs every 8th. Re-classify after refresh so a Cold mob
            // that becomes engaged (player walks into range) bumps to Hot on the next pass.
            var dueInterval = entry.Tier switch
            {
                Tier.Hot  => HotIntervalTicks,
                Tier.Warm => WarmIntervalTicks,
                _         => ColdIntervalTicks,
            };
            if (_tickCounter - entry.LastRefreshedTick >= dueInterval)
            {
                try { RefreshMutable(entry); }
                catch { /* stale entity memory — keep previous values */ }
                entry.LastRefreshedTick = _tickCounter;
                entry.Tier = ClassifyTier(entry, playerGrid);
            }
        }

        // Smart eviction. We keep stale entries forever within an area UNLESS:
        //   • Their cached grid is inside the network bubble (PoE should be streaming
        //     them), AND
        //   • They've been missing for at least InBubbleMissedWalksToEvict walks.
        // That combination = "we should be seeing them but they're gone" → genuine death/
        // pickup/consumption → evict.
        //
        // Out-of-bubble entries are kept indefinitely so re-entering range can pick them
        // back up cleanly (the wasStale path above triggers a fresh re-read).
        if (_byId.Count > 0)
        {
            var bubble2 = (long)Pathfinding.GridConstants.NetworkBubbleGrid * Pathfinding.GridConstants.NetworkBubbleGrid;
            List<uint>? evict = null;
            foreach (var (id, entry) in _byId)
            {
                if (entry.MissedWalks <= InBubbleMissedWalksToEvict) continue;
                var dx = entry.GridPosition.X - playerGrid.X;
                var dy = entry.GridPosition.Y - playerGrid.Y;
                var inBubble = (long)dx * dx + (long)dy * dy <= bubble2;
                if (inBubble) (evict ??= new List<uint>()).Add(id);
            }
            if (evict is not null) foreach (var id in evict) _byId.Remove(id);
        }
    }

    private static Tier ClassifyTier(Entry e, Vector2i playerGrid)
    {
        if (!e.IsAlive) return Tier.Cold;

        var dx = e.GridPosition.X - playerGrid.X;
        var dy = e.GridPosition.Y - playerGrid.Y;
        var bubble2 = (long)Pathfinding.GridConstants.NetworkBubbleGrid * Pathfinding.GridConstants.NetworkBubbleGrid;
        if ((long)dx * dx + (long)dy * dy > bubble2) return Tier.Cold;

        // Anything actively pathing or rare-or-better is "interesting" → Hot.
        if (e.IsMoving) return Tier.Hot;
        if (e.Rarity is EntityListReader.EntityRarity.Rare or EntityListReader.EntityRarity.Unique)
            return Tier.Hot;

        return Tier.Warm;
    }

    /// <summary>One-time read of all frozen fields plus a first read of mutables.</summary>
    private Entry? TryHydrate(nint addr, uint id)
    {
        try
        {
            var path     = EntityListReader.ReadEntityPath(_reader, addr) ?? string.Empty;
            var metadata = path;
            var split    = metadata.IndexOf('@');
            if (split >= 0) metadata = metadata[..split];

            var components = EntityComponents.ReadComponentMap(_reader, addr);

            var entry = new Entry
            {
                Address    = addr,
                Id         = id,
                Path       = path,
                Metadata   = metadata,
                Kind       = ClassifyKind(metadata, components),
                Components = components,
            };

            components.TryGetValue("Life",         out entry.LifeCompAddr);
            components.TryGetValue("Positioned",   out entry.PositionedCompAddr);
            components.TryGetValue("Pathfinding",  out entry.PathfindingCompAddr);
            components.TryGetValue("StateMachine", out entry.StateMachineCompAddr);
            components.TryGetValue("ObjectMagicProperties", out entry.OmpCompAddr);
            components.TryGetValue("Targetable",   out entry.TargetableCompAddr);
            components.TryGetValue("Render",       out entry.RenderCompAddr);
            components.TryGetValue("Chest",        out entry.ChestCompAddr);

            // Display name (Render +0x148 NativeString). Frozen — names don't change for an
            // entity's lifetime. Unique/rare mobs get this; trash returns empty.
            if (entry.RenderCompAddr != 0)
                entry.Name = NativeString.Read(_reader, entry.RenderCompAddr + KnownOffsets.RenderComponent.Name);

            // Rarity is frozen for a monster's lifetime. Read once.
            if (entry.OmpCompAddr != 0
                && _reader.TryReadStruct<int>(entry.OmpCompAddr + KnownOffsets.ObjectMagicPropertiesComponent.Rarity, out var r)
                && r is >= 0 and <= 4)
            {
                entry.Rarity = (EntityListReader.EntityRarity)r;
            }

            RefreshMutable(entry);
            return entry;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Re-read just the fields that change. Uses cached component addresses, so it's just
    /// a handful of <see cref="MemoryReader.TryReadStruct{T}"/> calls per entity per tick.
    /// </summary>
    private void RefreshMutable(Entry e)
    {
        if (e.PositionedCompAddr != 0)
            _reader.TryReadStruct(e.PositionedCompAddr + KnownOffsets.PositionedComponent.GridPosition, out e.GridPosition);

        if (e.LifeCompAddr != 0
            && _reader.TryReadStruct<VitalStruct>(e.LifeCompAddr + KnownOffsets.LifeComponent.Health, out var hp)
            && hp.LooksValid())
        {
            e.HpCurrent = hp.Current;
            e.HpMax     = hp.Max;
        }

        if (e.PathfindingCompAddr != 0
            && _reader.TryReadStruct<byte>(e.PathfindingCompAddr + KnownOffsets.PathfindingComponent.IsMoving, out var moving))
        {
            e.IsMoving = moving != 0;
        }

        if (e.TargetableCompAddr != 0
            && _reader.TryReadStruct<byte>(e.TargetableCompAddr + KnownOffsets.TargetableComponent.IsTargetable, out var targetable))
        {
            e.IsTargetable = targetable != 0;
        }

        if (e.ChestCompAddr != 0
            && _reader.TryReadStruct<byte>(e.ChestCompAddr + KnownOffsets.ChestComponent.IsOpened, out var opened))
        {
            e.IsOpened = opened != 0;
        }
    }

    private static EntityListReader.EntityKind ClassifyKind(string metadata, IReadOnlyDictionary<string, nint> components)
    {
        if (components.ContainsKey("Player")) return EntityListReader.EntityKind.Player;
        if (components.ContainsKey("WorldItem")) return EntityListReader.EntityKind.WorldItem;
        if (metadata.StartsWith("Metadata/Monsters/", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.Monster;
        if (metadata.StartsWith("Metadata/Chests/", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.Chest;
        if (metadata.Contains("AreaTransition", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.AreaTransition;
        if (metadata.Contains("TownPortal", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.TownPortal;
        if (metadata.Contains("Portal", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.Portal;
        if (metadata.Contains("MiscellaneousObjects/Stash", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.Stash;
        if (metadata.Contains("Shrine", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.Shrine;
        if (metadata.StartsWith("Metadata/Effects/", StringComparison.OrdinalIgnoreCase)) return EntityListReader.EntityKind.Effect;
        return EntityListReader.EntityKind.Unknown;
    }
}
