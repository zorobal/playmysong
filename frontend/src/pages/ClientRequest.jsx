import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API_URL from "../config";

export default function ClientRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const establishmentId = searchParams.get("establishmentId");
  const [activeTab, setActiveTab] = useState("playlists");
  const [playlists, setPlaylists] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [message, setMessage] = useState("");
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [establishment, setEstablishment] = useState(null);

  useEffect(() => {
    if (!establishmentId) {
      navigate("/");
      return;
    }
    loadEstablishment();
    loadPlaylists();
  }, [establishmentId]);

  async function loadEstablishment() {
    try {
      const res = await fetch(`${API_URL}/establishments/public/${establishmentId}`);
      if (res.ok) {
        const data = await res.json();
        setEstablishment(data);
      }
    } catch (err) {
      console.error("Error loading establishment:", err);
    }
  }

  async function loadPlaylists() {
    try {
      const res = await fetch(`${API_URL}/establishments/${establishmentId}/playlist`);
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error("Error loading playlists:", err);
    }
  }

  async function searchYouTube() {
    if (!youtubeQuery.trim()) return;
    try {
      const res = await fetch(`${API_URL}/youtube/search?q=${encodeURIComponent(youtubeQuery)}`);
      const data = await res.json();
      setYoutubeResults(data || []);
    } catch (err) {
      console.error("YouTube search error:", err);
      setYoutubeResults([]);
    }
  }

  function handleSelfieSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setSelfiePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function submitRequest() {
    if (!selectedSong) return setStatus("Sélectionnez une chanson");
    if (!consent) return setStatus("Veuillez accepter le droit à l'image");
    
    setStatus("Envoi en cours...");
    
    const formData = new FormData();
    formData.append("establishmentId", establishmentId);
    formData.append("title", selectedSong.title);
    formData.append("artist", selectedSong.artist || "");
    if (selectedSong.youtubeId) {
      formData.append("youtubeId", selectedSong.youtubeId);
    }
    if (selectedSong.filePath) {
      formData.append("filePath", selectedSong.filePath);
    }
    if (message) formData.append("message", message);
    if (selfieFile) formData.append("selfie", selfieFile);
    formData.append("consent", "true");

    try {
      const res = await fetch(`${API_URL}/request`, {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        setStatus("✓ Envoyé ! En attente de validation.");
        setSelectedSong(null);
        setMessage("");
        setSelfieFile(null);
        setSelfiePreview(null);
        setConsent(false);
      } else {
        const err = await res.json();
        setStatus("Erreur: " + (err.error || "Inconnue"));
      }
    } catch (err) {
      setStatus("Erreur lors de l'envoi");
    }
  }

  const allSongs = playlists.flatMap(pl => 
    (pl.songs || []).map(song => ({ ...song, playlistName: pl.name }))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "#e94560", color: "white", padding: "15px 20px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>🎵 PlayMySong</h1>
        <p style={{ margin: "5px 0 0", opacity: 0.9 }}>{establishment?.name || "Établissement"}</p>
      </header>

      <div style={{ padding: "15px", background: "white", borderBottom: "1px solid #ddd" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setActiveTab("playlists")}
            style={{ 
              flex: 1, 
              padding: "12px", 
              border: "none", 
              borderRadius: "8px",
              background: activeTab === "playlists" ? "#e94560" : "#eee",
              color: activeTab === "playlists" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            📋 Playlists
          </button>
          <button 
            onClick={() => setActiveTab("youtube")}
            style={{ 
              flex: 1, 
              padding: "12px", 
              border: "none", 
              borderRadius: "8px",
              background: activeTab === "youtube" ? "#e94560" : "#eee",
              color: activeTab === "youtube" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            🔍 YouTube
          </button>
        </div>
      </div>

      <div style={{ padding: "15px" }}>
        {activeTab === "playlists" && (
          <div>
            <input 
              placeholder="Rechercher dans les playlists..."
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                if (!q) return;
                const found = allSongs.find(s => 
                  s.title.toLowerCase().includes(q) || 
                  (s.artist || "").toLowerCase().includes(q)
                );
                if (found) setSelectedSong(found);
              }}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "15px" }}
            />
            {playlists.map(pl => (
              <div key={pl.id} style={{ marginBottom: "20px" }}>
                <h3 style={{ margin: "10px 0", color: "#333" }}>📁 {pl.name}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(pl.songs || []).map(song => (
                    <div 
                      key={song.id}
                      onClick={() => setSelectedSong({ ...song, source: "playlist" })}
                      style={{ 
                        padding: "12px", 
                        background: selectedSong?.id === song.id ? "#e94560" : "white",
                        color: selectedSong?.id === song.id ? "white" : "#333",
                        borderRadius: "8px",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{song.title}</div>
                      <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{song.artist || "Artiste inconnu"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {allSongs.length === 0 && <p style={{ textAlign: "center", color: "#666" }}>Aucune chanson dans les playlists</p>}
          </div>
        )}

        {activeTab === "youtube" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <input 
                placeholder="Rechercher sur YouTube..."
                value={youtubeQuery}
                onChange={(e) => setYoutubeQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchYouTube()}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
              />
              <button onClick={searchYouTube} style={{ padding: "12px 20px", background: "#e94560", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                Rechercher
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {youtubeResults.map(video => (
                <div 
                  key={video.id}
                  onClick={() => setSelectedSong({ 
                    title: video.title, 
                    artist: video.channel,
                    youtubeId: video.id,
                    source: "youtube"
                  })}
                  style={{ 
                    padding: "12px", 
                    background: selectedSong?.youtubeId === video.id ? "#e94560" : "white",
                    color: selectedSong?.youtubeId === video.id ? "white" : "#333",
                    borderRadius: "8px",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center"
                  }}
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{video.title}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{video.channel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSong && (
        <div style={{ 
          position: "fixed", 
          bottom: 0, 
          left: 0, 
          right: 0, 
          background: "white", 
          padding: "20px",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
          borderRadius: "20px 20px 0 0"
        }}>
          <div style={{ marginBottom: "15px", padding: "15px", background: "#f9f9f9", borderRadius: "10px" }}>
            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{selectedSong.title}</div>
            <div style={{ color: "#666" }}>{selectedSong.artist || "Artiste inconnu"}</div>
            <div style={{ fontSize: "0.8rem", color: "#999", marginTop: "5px" }}>
              {selectedSong.source === "youtube" ? "🔴 YouTube" : "📁 Playlist locale"}
            </div>
          </div>

          <input 
            placeholder="Message / dédicace (optionnel)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "10px" }}
          />

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>
              <span style={{ fontWeight: "bold" }}>📷 Selfie (optionnel)</span>
            </label>
            <input 
              type="file" 
              accept="image/*" 
              capture="user"
              onChange={handleSelfieSelect}
              style={{ display: "none" }}
              id="selfie-input"
            />
            <label 
              htmlFor="selfie-input"
              style={{ 
                display: "inline-block", 
                padding: "10px 20px", 
                background: "#eee", 
                borderRadius: "8px", 
                cursor: "pointer" 
              }}
            >
              {selfiePreview ? "Changer la photo" : "Prendre une photo"}
            </label>
            {selfiePreview && (
              <div style={{ marginTop: "10px" }}>
                <img src={selfiePreview} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} style={{ marginLeft: "10px", padding: "5px 10px", background: "#ff4444", color: "white", border: "none", borderRadius: "4px" }}>
                  ×
                </button>
              </div>
            )}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
            <input 
              type="checkbox" 
              checked={consent} 
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span style={{ fontSize: "0.9rem" }}>J'accepte que ma photo soit affichée</span>
          </label>

          <button 
            onClick={submitRequest}
            disabled={!consent}
            style={{ 
              width: "100%", 
              padding: "15px", 
              background: consent ? "#e94560" : "#ccc", 
              color: "white", 
              border: "none", 
              borderRadius: "10px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: consent ? "pointer" : "not-allowed"
            }}
          >
            {status || "Soumettre ma demande"}
          </button>
        </div>
      )}

      <div style={{ height: selectedSong ? "250px" : "20px" }} />
    </div>
  );
}
