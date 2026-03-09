import { useEffect, useState } from "react";
import { getPlaylist } from "../services/api.js";
import SongFooterBar from "../components/SongFooterBar.jsx";
import PlaylistItem from "../components/PlaylistItem.jsx";
import "../styles/playlist.css";

export default function PlaylistView() {
  const params = new URLSearchParams(window.location.search);
  const establishmentId = params.get("establishmentId") || "default";
  const [playlist, setPlaylist] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlaylist(establishmentId);
        setPlaylist(data || []);
      } catch (err) {
        setPlaylist([]);
      }
    }
    load();
  }, [establishmentId]);

  const filtered = playlist
    .filter(item => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        (item.title || "").toLowerCase().includes(q) ||
        (item.artist || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const A = (a[sortBy] || "").toLowerCase();
      const B = (b[sortBy] || "").toLowerCase();
      return A.localeCompare(B);
    });

  return (
    <main style={{ padding: 20 }}>
      <h2>Playlist de l'établissement</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setSortBy("title")} aria-pressed={sortBy === "title"}>Titre</button>
        <button onClick={() => setSortBy("artist")} aria-pressed={sortBy === "artist"} style={{ marginLeft: 8 }}>Artiste</button>
        <input
          placeholder="Recherche en temps réel..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ marginLeft: 12, padding: 6 }}
        />
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {filtered.map(item => (
          <PlaylistItem key={item.id} item={item} onSelect={() => setSelected(item)} />
        ))}
        {filtered.length === 0 && <li>Aucune chanson trouvée</li>}
      </ul>

      <SongFooterBar selected={selected} establishmentId={establishmentId} />
    </main>
  );
}
