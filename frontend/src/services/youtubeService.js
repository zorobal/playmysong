// Appelle le backend proxy /youtube/search
export async function searchYouTube(query) {
  const res = await fetch(`/youtube/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    // fallback stub si backend absent
    return [
      { id: "stub1", title: `${query} (exemple)`, channel: "YouTube" },
      { id: "stub2", title: `${query} (exemple 2)`, channel: "YouTube" }
    ];
  }
  return res.json();
}
