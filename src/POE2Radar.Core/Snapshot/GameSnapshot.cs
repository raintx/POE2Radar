using POE2Radar.Core.Game;

namespace POE2Radar.Core.Snapshot;

/// <summary>
/// One tick's view of the game. Construct it once per world tick, hand it to the renderer,
/// then discard.
///
/// Every accessor is lazy — components/UI/labels are only read on first touch and cached
/// for the lifetime of this snapshot. Anything the renderer doesn't ask for is never read.
///
/// Cross-tick caches (frozen entity fields) are owned by <see cref="EntityCache"/>, not by
/// this snapshot.
/// </summary>
public sealed class GameSnapshot
{
    private readonly MemoryReader _reader;
    private readonly nint _ingameDataAddress;
    private readonly nint _ingameStateAddress;
    private readonly WindowInfo _window;

    private PlayerView? _player;
    private IReadOnlyList<GroundLabelView>? _labels;
    private NavGrid? _nav;
    private MapView? _map;
    private CameraView? _camera;

    public GameSnapshot(
        MemoryReader reader,
        nint ingameDataAddress,
        nint ingameStateAddress,
        WindowInfo window)
    {
        _reader = reader;
        _ingameDataAddress = ingameDataAddress;
        _ingameStateAddress = ingameStateAddress;
        _window = window;
    }

    public WindowInfo Window => _window;
    public DateTime ReadAt { get; } = DateTime.UtcNow;

    /// <summary>
    /// Underlying memory reader. Exposed so render-side code can do per-frame entity reads
    /// (e.g. plotting hostile monsters on the map overlay) without the snapshot pre-building
    /// a list.
    /// </summary>
    public MemoryReader Reader => _reader;

    /// <summary>Address of the IngameData root — for reads not modeled as snapshot views.</summary>
    public nint IngameDataAddress => _ingameDataAddress;

    /// <summary>
    /// Per-area instance hash. Changes on every area transition. Use this to invalidate
    /// per-area caches like the terrain bitmap.
    /// </summary>
    public uint AreaHash
    {
        get
        {
            _reader.TryReadStruct<uint>(_ingameDataAddress + KnownOffsets.IngameData.CurrentAreaHash, out var hash);
            return hash;
        }
    }

    /// <summary>
    /// Static-terrain navigation view (walkable + targeting layers). Lazy: per-cell reads
    /// only happen when something asks for them.
    /// </summary>
    public NavGrid Nav => _nav ??= new NavGrid(_reader, _ingameDataAddress);

    /// <summary>
    /// In-game map UI state — large M-key map and corner minimap. Drives when to draw the
    /// terrain overlay and how to project grid coordinates onto PoE2's map canvas.
    /// </summary>
    public MapView Map => _map ??= new MapView(_reader, _ingameStateAddress);

    /// <summary>
    /// Camera projection — world (or grid) coordinates → screen. One matrix read per snapshot.
    /// </summary>
    public CameraView Camera => _camera ??= new CameraView(_reader, _ingameStateAddress);

    /// <summary>Lazy player view. Returns null if the local player pointer is missing.</summary>
    public PlayerView? Player
    {
        get
        {
            if (_player is not null) return _player;
            if (!_reader.TryReadStruct<nint>(_ingameDataAddress + KnownOffsets.IngameData.LocalPlayer, out var addr)
                || addr == 0)
                return null;
            _player = new PlayerView(_reader, addr);
            return _player;
        }
    }

    /// <summary>
    /// Visible ground item labels. Only the cheap header fields are read up front; per-label
    /// heavy reads (rect, entity components) happen lazily as code touches them.
    /// </summary>
    public IReadOnlyList<GroundLabelView> GroundLabels
    {
        get
        {
            if (_labels is not null) return _labels;
            var player = Player;
            if (player is null)
                return _labels = Array.Empty<GroundLabelView>();

            var rootPtr = ReadUiPanelPointer(KnownOffsets.IngameUiElements.ItemsOnGroundLabelRoot);
            if (rootPtr == 0)
                return _labels = Array.Empty<GroundLabelView>();

            var raw = GroundLabelReader.ReadLabels(_reader, rootPtr);
            var views = new List<GroundLabelView>(raw.Count);
            foreach (var l in raw)
                views.Add(new GroundLabelView(
                    _reader, l.Address, l.LabelElement, l.ItemEntity,
                    player, _window.Width, _window.Height));

            return _labels = views;
        }
    }

    private nint ReadUiPanelPointer(int offsetFromIngameUi)
    {
        // IngameState → IngameUi (root element). Panel pointers live at offsets within IngameUi.
        if (!_reader.TryReadStruct<nint>(_ingameStateAddress + KnownOffsets.IngameState.IngameUi, out var ingameUi)
            || ingameUi == 0)
            return 0;
        return _reader.TryReadStruct<nint>(ingameUi + offsetFromIngameUi, out var ptr) ? ptr : 0;
    }
}
