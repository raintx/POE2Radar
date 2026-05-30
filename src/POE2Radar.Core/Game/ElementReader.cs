namespace POE2Radar.Core.Game;

public static class ElementReader
{
    public sealed record ElementSnapshot(
        nint Address,
        bool IsValid,
        bool IsVisibleLocal,
        Vector2 Position,
        Vector2 Size,
        float Scale,
        nint Parent,
        IReadOnlyList<nint> Children);

    public static ElementSnapshot? TryReadSnapshot(MemoryReader reader, nint elementAddress, int maxChildren = 10_000)
    {
        if (!LooksLikeUserAddress(elementAddress))
            return null;
        if (!reader.TryReadStruct<Element>(elementAddress, out var element))
            return null;

        var children = ReadChildren(reader, element.Childs, maxChildren);
        // IsVisibleLocal is bit 11 (0x800) of Flags in modern ExileCore — not bit 2 (0x04)
        // as old ExileApi used. Validated 2026-05-05.
        return new ElementSnapshot(
            elementAddress,
            element.SelfPointer == elementAddress,
            (element.Flags & 0x800) == 0x800,
            element.Position,
            element.Size,
            element.Scale,
            element.Parent,
            children);
    }

    public static bool TryGetChild(MemoryReader reader, nint elementAddress, int index, out nint childAddress)
    {
        childAddress = 0;
        if (index < 0 || !LooksLikeUserAddress(elementAddress))
            return false;
        if (!reader.TryReadStruct<Element>(elementAddress, out var element))
            return false;
        if (index >= element.Childs.Count)
            return false;
        return reader.TryReadStruct(element.Childs.First + index * 8, out childAddress)
            && LooksLikeUserAddress(childAddress);
    }

    private static IReadOnlyList<nint> ReadChildren(MemoryReader reader, NativePtrArray childArray, int maxChildren)
    {
        var count = childArray.Count;
        if (count <= 0 || count > maxChildren)
            return Array.Empty<nint>();

        var result = new nint[count];
        for (var i = 0; i < count; i++)
        {
            if (!reader.TryReadStruct<nint>(childArray.First + i * 8, out result[i]))
                return Array.Empty<nint>();
        }

        return result;
    }

    private static bool LooksLikeUserAddress(nint p)
    {
        var v = (long)p;
        return v > 0x10000 && v < 0x7FFF_FFFF_FFFF;
    }
}
