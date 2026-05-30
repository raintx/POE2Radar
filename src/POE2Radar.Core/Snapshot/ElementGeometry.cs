using POE2Radar.Core.Game;

namespace POE2Radar.Core.Snapshot;

/// <summary>
/// Computes the window-relative rectangle of a UI <see cref="Element"/> by walking up its
/// parent chain. Mirrors the math ExileCore uses: each parent contributes its position, and
/// scale compounds multiplicatively. The result is in client (window) coordinates and matches
/// what the game draws on screen.
/// </summary>
public static class ElementGeometry
{
    private const int MaxParentDepth = 32;

    public readonly record struct Rect(float X, float Y, float Width, float Height)
    {
        public float CenterX => X + Width  * 0.5f;
        public float CenterY => Y + Height * 0.5f;

        public bool IntersectsWindow(int windowWidth, int windowHeight)
            => Width > 0 && Height > 0
            && X + Width  > 0 && X < windowWidth
            && Y + Height > 0 && Y < windowHeight;
    }

    /// <summary>
    /// Read the element's rect in window-relative coords. Returns null on bad reads or
    /// implausible parent chains.
    /// </summary>
    public static Rect? TryReadRect(MemoryReader reader, nint elementAddress)
    {
        if (!LooksLikeUserAddress(elementAddress))
            return null;
        if (!reader.TryReadStruct<Element>(elementAddress, out var leaf))
            return null;

        // Walk parents accumulating position. Scale compounds from root downward, so we
        // collect the chain first and then apply.
        Span<Element> chain = stackalloc Element[MaxParentDepth];
        var depth = 0;
        chain[depth++] = leaf;

        var p = leaf.Parent;
        while (p != 0 && depth < MaxParentDepth)
        {
            if (!LooksLikeUserAddress(p)) return null;
            if (!reader.TryReadStruct<Element>(p, out var parent)) return null;
            chain[depth++] = parent;
            p = parent.Parent;
            if (p == chain[depth - 1].SelfPointer) break; // root self-loop
        }

        // Root → leaf accumulation. Position is in parent-local units; scale compounds.
        float rootScale = chain[depth - 1].Scale > 0 ? chain[depth - 1].Scale : 1f;
        float scale = rootScale;
        float x = 0f, y = 0f;

        for (var i = depth - 1; i >= 0; i--)
        {
            var e = chain[i];
            x += e.Position.X * scale;
            y += e.Position.Y * scale;
            if (i > 0)
            {
                var s = e.Scale > 0 ? e.Scale : 1f;
                scale *= s / rootScale;
            }
        }

        var w = leaf.Size.X * scale;
        var h = leaf.Size.Y * scale;
        return new Rect(x, y, w, h);
    }

    private static bool LooksLikeUserAddress(nint p)
    {
        var v = (long)p;
        return v > 0x10000 && v < 0x7FFF_FFFF_FFFF;
    }
}
