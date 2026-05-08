/**
 * Reverse geocode coordinates to a human-readable location name.
 * Uses the free OpenStreetMap Nominatim API.
 */
export async function reverseGeocode(
    latitude: number,
    longitude: number,
): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
            {
                headers: {
                    "User-Agent": "Obelisk/1.0",
                },
            },
        );

        if (!res.ok) return "";

        const data = await res.json();
        const addr = data.address;

        if (!addr) return "";

        // Build a concise location string
        const city =
            addr.city ??
            addr.town ??
            addr.village ??
            addr.municipality ??
            "";
        const state = addr.state ?? "";
        const country = addr.country ?? "";

        const parts = [city, state, country].filter(Boolean);
        return parts.slice(0, 2).join(", ") || data.display_name || "";
    } catch {
        return "";
    }
}
