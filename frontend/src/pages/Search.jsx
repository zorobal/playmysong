import { useState } from "react";
import { searchYouTube } from "../services/youtubeService.js";
import SongFooterBar from "../components/SongFooterBar.jsx";

export default function Search() {
  const params = new URLSearchParams(window.location.search);
  const establishmentId = params.get("establishmentId") || "default";
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  async function onChange(e) {
    const v = e.target.value;
    setQ(v);
    if (!v) return setResults([]);
    try {
      const res = await searchYouTube(v);
      setResults(res || []);
    } catch {
      setResults([]);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h2>Recherche YouTube</h2>
      <input placeholder="Tapez pour rechercher..." value={q} onChange={onChange} style={{ width: "100%", padding: 8 }} />
      <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
        {results.map(r => (
          <li key={r.id} style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{r.title}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{r.channel}</div>
            </div>
            <div>
              <button onClick={() => setSelected({ id: r.id, title: r.title, artist: r.channel, youtubeId: r.id })}>Choisir</button>
            </div>
          </li>
        ))}
      </ul>

      <SongFooterBar selected={selected} establishmentId={establishmentId} />
    </main>
  );
}
