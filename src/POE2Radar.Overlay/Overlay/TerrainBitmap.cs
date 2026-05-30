using System.Runtime.InteropServices;
using POE2Radar.Core.Pathfinding;
using POE2Radar.Core.Snapshot;
using Vortice.DCommon;
using Vortice.Direct2D1;
using Vortice.DXGI;
using Vortice.Mathematics;

namespace POE2Radar.Overlay;

/// <summary>
/// Direct2D bitmap of the walkable terrain mask, built once per area. One pixel per grid
/// cell — alpha = walkability. Cache key is (width, height, areaHash) — two maps can
/// share dimensions, so dimension-only keying would silently keep the previous map's
/// terrain after a transition.
/// </summary>
public sealed class TerrainBitmap : IDisposable
{
    private readonly ID2D1RenderTarget _renderTarget;
    private ID2D1Bitmap? _bitmap;
    private int _builtForWidth;
    private int _builtForHeight;
    private uint _builtForAreaHash;

    public TerrainBitmap(ID2D1RenderTarget renderTarget)
    {
        _renderTarget = renderTarget;
    }

    public ID2D1Bitmap? Bitmap => _bitmap;
    public int Width  => _builtForWidth;
    public int Height => _builtForHeight;
    public uint AreaHash => _builtForAreaHash;

    /// <summary>
    /// Build (or rebuild) the bitmap from the given navigation grid. Cheap if width, height,
    /// AND <paramref name="areaHash"/> all match the cached version. <paramref name="inTransition"/>
    /// forces an immediate drop regardless of hash — needed because PoE briefly leaves the
    /// previous area's hash readable while transitioning, so hash-only keying can't tell us
    /// the area is changing.
    /// </summary>
    public void EnsureBuilt(NavGrid nav, uint areaHash, bool inTransition)
    {
        // Drop the stale bitmap whenever we know the area is changing OR the hash already
        // shifted. Drawing "loading…" for a few frames beats showing the previous map's
        // terrain over the new area.
        if (_bitmap is not null && (inTransition || areaHash != _builtForAreaHash))
        {
            _bitmap.Dispose();
            _bitmap = null;
            _builtForAreaHash = 0;
        }

        if (inTransition || !nav.IsAvailable) return;
        if (_bitmap is not null
            && nav.Width  == _builtForWidth
            && nav.Height == _builtForHeight
            && areaHash   == _builtForAreaHash) return;

        var w = nav.Width;
        var h = nav.Height;
        var walkable = new byte[w * h];
        for (var y = 0; y < h; y++)
            for (var x = 0; x < w; x++)
                walkable[y * w + x] = (byte)nav.Walkable(x, y);
        BuildFrom(walkable, w, h, areaHash);
    }

    /// <summary>
    /// Build (or rebuild) from a flat 0/1 walkable array (PoE2 path — no NavGrid). Cheap when
    /// dimensions + <paramref name="areaHash"/> match the cached bitmap.
    /// </summary>
    public void EnsureBuiltRaw(byte[] walkable, int width, int height, uint areaHash, bool inTransition)
    {
        if (_bitmap is not null && (inTransition || areaHash != _builtForAreaHash))
        {
            _bitmap.Dispose(); _bitmap = null; _builtForAreaHash = 0;
        }
        if (inTransition || width <= 0 || height <= 0) return;
        if (_bitmap is not null && width == _builtForWidth && height == _builtForHeight && areaHash == _builtForAreaHash) return;
        BuildFrom(walkable, width, height, areaHash);
    }

    private void BuildFrom(byte[] walkable, int w, int h, uint areaHash)
    {
        var pixels = new byte[w * h * 4]; // BGRA

        // Render style with per-pixel alpha:
        //   • Walkable interior → very faint blue-grey wash (alpha ≈ 30/255). Reads as
        //     "you can walk here" without occluding what's behind.
        //   • Wall edge (walkable cell adjacent to an unwalkable cell or grid boundary) →
        //     bright cyan at moderate alpha (~180/255). Strong enough to outline rooms.
        //   • Walls themselves stay alpha 0 so PoE's actual map shows through.

        const byte interiorAlpha = 30;
        const byte edgeAlpha     = 180;

        for (var y = 0; y < h; y++)
        {
            for (var x = 0; x < w; x++)
            {
                var v = walkable[y * w + x];
                var idx = (y * w + x) * 4;
                if (v == 0) continue;

                var isEdge = false;
                for (var dy = -1; dy <= 1 && !isEdge; dy++)
                {
                    var ny = y + dy;
                    if (ny < 0 || ny >= h) { isEdge = true; break; }
                    for (var dx = -1; dx <= 1; dx++)
                    {
                        if (dx == 0 && dy == 0) continue;
                        var nx = x + dx;
                        if (nx < 0 || nx >= w) { isEdge = true; break; }
                        if (walkable[ny * w + nx] == 0) { isEdge = true; break; }
                    }
                }

                if (isEdge)
                {
                    pixels[idx + 0] = 255;        // B
                    pixels[idx + 1] = 220;        // G
                    pixels[idx + 2] = 60;         // R
                    pixels[idx + 3] = edgeAlpha;
                }
                else
                {
                    pixels[idx + 0] = 130;        // B
                    pixels[idx + 1] = 100;        // G
                    pixels[idx + 2] = 80;         // R
                    pixels[idx + 3] = interiorAlpha;
                }
            }
        }

        _bitmap?.Dispose();
        var props = new BitmapProperties(new PixelFormat(Format.B8G8R8A8_UNorm, Vortice.DCommon.AlphaMode.Premultiplied));
        // Premultiply alpha so D2D blends correctly.
        for (var i = 0; i < pixels.Length; i += 4)
        {
            var a = pixels[i + 3];
            if (a == 255) continue;
            var af = a / 255f;
            pixels[i + 0] = (byte)(pixels[i + 0] * af);
            pixels[i + 1] = (byte)(pixels[i + 1] * af);
            pixels[i + 2] = (byte)(pixels[i + 2] * af);
        }

        var size = new SizeI(w, h);
        var pinned = GCHandle.Alloc(pixels, GCHandleType.Pinned);
        try
        {
            _bitmap = _renderTarget.CreateBitmap(size, pinned.AddrOfPinnedObject(), (uint)(w * 4), props);
        }
        finally
        {
            pinned.Free();
        }
        _builtForWidth     = w;
        _builtForHeight    = h;
        _builtForAreaHash  = areaHash;
    }

    public void Dispose()
    {
        _bitmap?.Dispose();
        _bitmap = null;
    }
}
