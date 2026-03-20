import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API_URL, { SOCKET_URL } from "../config";

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [validatedRequests, setValidatedRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, validated: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("playlists");
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [ytSearch, setYtSearch] = useState("");
  const [ytResults, setYtResults] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytAdding, setYtAdding] = useState(false);
  const [ytPlaylistId, setYtPlaylistId] = useState(null);
  const navigate = useNavigate();
  
  const accessToken = localStorage.getItem("token");

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }
    loadData();
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!establishment?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join_establishment", establishment.id);
    });

    socket.on("request_validated", ({ request, requestId }) => {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      if (request) {
        setValidatedRequests(prev => [...prev, request]);
      }
    });

    socket.on("request_rejected", ({ requestId }) => {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    });
    
    socket.on("request_completed", ({ requestId }) => {
      setValidatedRequests(prev => prev.filter(r => r.id !== requestId));
    });

    return () => socket.disconnect();
  }, [establishment?.id]);

  async function loadData() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const userRes = await fetch(`${API_URL}/users/me`, { headers });
      const userData = await userRes.json();
      console.log("User data:", userData);
      
      if (userData.error) {
        console.error("Error loading user:", userData.error);
        setLoading(false);
        return;
      }
      
      setUser(userData);
      setEstablishment(userData?.establishment);

      if (userData?.establishmentId) {
        const playlistsRes = await fetch(`${API_URL}/playlists?establishmentId=${userData.establishmentId}`, { headers });
        const playlistsData = await playlistsRes.json();
        console.log("Playlists:", playlistsData);
        setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);

        const pendingRes = await fetch(`${API_URL}/requests?establishmentId=${userData.establishmentId}&status=PENDING`, { headers });
        const pendingData = await pendingRes.json();
        setPendingRequests(Array.isArray(pendingData) ? pendingData : []);

        const validatedRes = await fetch(`${API_URL}/requests?establishmentId=${userData.establishmentId}&status=VALIDATED`, { headers });
        const validatedData = await validatedRes.json();
        setValidatedRequests(Array.isArray(validatedData) ? validatedData : []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createPlaylist(name) {
    try {
      if (!establishment?.id) {
        alert("Erreur: Pas d'établissement associé");
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          establishmentId: establishment.id,
          createdBy: user?.id
        })
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert("Erreur: " + (err.error || "Inconnu"));
      }
    } catch (err) {
      alert("Erreur lors de la création");
    }
  }

  async function deletePlaylist(playlistId) {
    if (!confirm("Supprimer cette playlist?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/playlists/${playlistId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  }

  async function addSong(playlistId, title, artist) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/playlists/${playlistId}/musics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, artist })
      });
      if (res.ok) {
        loadData();
        setSelectedPlaylist(null);
      }
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
  }

  async function deleteSong(playlistId, songId) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/playlists/${playlistId}/musics/${songId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  }

  async function validateRequest(requestId) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/request/${requestId}/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      alert("Erreur lors de la validation");
    }
  }

  async function rejectRequest(requestId) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/request/${requestId}/reject`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      setShowRejectModal(null);
      setRejectReason("");
      loadData();
    } catch (err) {
      alert("Erreur lors du rejet");
    }
  }

  async function handleFileSelect(playlistId) {
    setYtPlaylistId(playlistId);
    setYtSearch("");
    setYtResults([]);
  }

  async function searchYouTube(e) {
    e.preventDefault();
    if (!ytSearch.trim()) return;
    
    setYtLoading(true);
    try {
      const res = await fetch(`${API_URL}/youtube/search?q=${encodeURIComponent(ytSearch)}`);
      const data = await res.json();
      setYtResults(data.items || []);
    } catch (err) {
      console.error("Search error:", err);
    }
    setYtLoading(false);
  }

  async function addYouTubeSong(video) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expirée");
      return;
    }
    
    setYtAdding(true);
    try {
      const res = await fetch(`${API_URL}/playlists/${ytPlaylistId}/upload`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: video.snippet.title,
          artist: video.snippet.channelTitle,
          youtubeId: video.id.videoId,
          filePath: null
        })
      });
      
      if (res.ok) {
        setYtPlaylistId(null);
        loadData();
      } else {
        alert("Erreur lors de l'ajout");
      }
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
    setYtAdding(false);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="user-dashboard">
      {ytPlaylistId && (
        <div className="yt-modal-overlay" onClick={() => setYtPlaylistId(null)}>
          <div className="yt-modal" onClick={e => e.stopPropagation()}>
            <h3>🎵 Rechercher sur YouTube</h3>
            <form onSubmit={searchYouTube} className="yt-search-form">
              <input
                type="text"
                value={ytSearch}
                onChange={(e) => setYtSearch(e.target.value)}
                placeholder="Titre de la chanson..."
                autoFocus
              />
              <button type="submit" disabled={ytLoading}>{ytLoading ? '...' : '🔍'}</button>
            </form>
            <div className="yt-results">
              {ytResults.map((video) => (
                <button key={video.id.videoId} className="yt-result-item" onClick={() => addYouTubeSong(video)} disabled={ytAdding}>
                  <img src={video.snippet.thumbnails?.medium?.url} alt="" />
                  <div className="yt-result-info">
                    <p className="yt-result-title">{video.snippet.title}</p>
                    <p className="yt-result-channel">{video.snippet.channelTitle}</p>
                  </div>
                  <span>{ytAdding ? '⏳' : '➕'}</span>
                </button>
              ))}
              {ytResults.length === 0 && !ytLoading && ytSearch && <p className="yt-no-results">Aucun résultat</p>}
            </div>
            <button className="yt-close-btn" onClick={() => setYtPlaylistId(null)}>Fermer</button>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎵 PlayMySong</h1>
          <span className="establishment-name">
            {establishment?.name || "Mon Établissement"}
          </span>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === "playlists" ? "active" : ""}`}
          onClick={() => setActiveTab("playlists")}
        >
          📋 Playlists ({playlists.length})
        </button>
        <button 
          className={`tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          📥 Demandes ({stats.pending})
        </button>
        <button 
          className={`tab ${activeTab === "queue" ? "active" : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          🎵 File d'attente ({stats.validated})
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === "playlists" && (
          <div className="playlists-panel">
            <div className="panel-header">
              <h2>Gestion des Playlists</h2>
              <div className="create-playlist">
                <input
                  id="newPlaylistName"
                  placeholder="Nom de la playlist"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createPlaylist(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <button onClick={() => {
                  const input = document.getElementById('newPlaylistName');
                  if (input.value) {
                    createPlaylist(input.value);
                    input.value = '';
                  }
                }}>+ Créer</button>
              </div>
            </div>

            <div className="playlists-grid">
              {playlists.map(playlist => (
                <div key={playlist.id} className="playlist-card">
                  <div className="playlist-header">
                    <h3>🎶 {playlist.name} {playlist.createdBy && <span className="created-by">par: {playlist.createdBy}</span>}</h3>
                    <button 
                      className="btn-danger-small"
                      onClick={() => deletePlaylist(playlist.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                  
                  <div className="songs-list">
                    {(playlist.songs || []).length === 0 ? (
                      <p className="no-songs">Aucune chanson</p>
                    ) : (
                      (playlist.songs || []).map(song => (
                        <div key={song.id} className="song-item">
                          <span>{song.title} - {song.artist}</span>
                          <button 
                            onClick={() => deleteSong(playlist.id, song.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="add-song-form">
                    <input
                      placeholder="Titre"
                      id={`title-${playlist.id}`}
                    />
                    <input
                      placeholder="Artiste"
                      id={`artist-${playlist.id}`}
                    />
                    <button onClick={() => {
                      const titleInput = document.getElementById(`title-${playlist.id}`);
                      const artistInput = document.getElementById(`artist-${playlist.id}`);
                      if (titleInput.value) {
                        addSong(playlist.id, titleInput.value, artistInput.value);
                        titleInput.value = '';
                        artistInput.value = '';
                      }
                    }}>+ Ajouter chanson</button>
                    <button onClick={() => handleFileSelect(playlist.id)} title="Ajouter une chanson">➕</button>
                  </div>
                </div>
              ))}
            </div>

            {playlists.length === 0 && (
              <div className="empty-state">
                <p>Aucune playlist créée</p>
                <p>Créez votre première playlist ci-dessus</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="requests-panel">
            <h2>Gestion des Demandes</h2>
            
            <div className="stats-grid">
              <div className="stat-card stat-total">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-card stat-pending">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">En attente</div>
              </div>
              <div className="stat-card stat-validated">
                <div className="stat-number">{stats.validated}</div>
                <div className="stat-label">Validées</div>
              </div>
              <div className="stat-card stat-rejected">
                <div className="stat-number">{stats.rejected}</div>
                <div className="stat-label">Rejetées</div>
              </div>
            </div>

            <h3>Demandes en attente</h3>
            {pendingRequests.length === 0 ? (
              <p className="empty-message">Aucune demande en attente</p>
            ) : (
              <div className="requests-list">
                {pendingRequests.map((req, index) => (
                  <div key={req.id} className="request-card">
                    <div className="request-position">#{index + 1}</div>
                    <div className="request-info">
                      <h4>{req.title}</h4>
                      <p>{req.artist}</p>
                      {req.message && <p className="message">💬 {req.message}</p>}
                      {req.selfieUrl && (
                        <img 
                          src={`${API_URL}${req.selfieUrl}`} 
                          alt="Selfie" 
                          className="selfie-thumbnail"
                        />
                      )}
                    </div>
                    <div className="request-actions">
                      <button 
                        className="btn-validate"
                        onClick={() => validateRequest(req.id)}
                      >
                        ✅ Valider
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => setShowRejectModal(req.id)}
                      >
                        ❌ Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showRejectModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <h3>Motif du rejet</h3>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Entrez le motif du rejet (optionnel)"
                    rows={3}
                  />
                  <div className="modal-actions">
                    <button onClick={() => setShowRejectModal(null)}>Annuler</button>
                    <button onClick={() => rejectRequest(showRejectModal)} className="btn-reject">
                      Confirmer le rejet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "queue" && (
          <div className="queue-panel">
            <h2>File d'attente des demandes</h2>
            {validatedRequests.length === 0 ? (
              <p className="empty-message">Aucune demande en attente</p>
            ) : (
              <div className="requests-list">
                {validatedRequests.map((req, index) => (
                  <div key={req.id} className="request-card">
                    <div className="request-position">#{index + 1}</div>
                    <div className="request-info">
                      <h4>{req.title}</h4>
                      <p>{req.artist}</p>
                      {req.message && <p className="message">💬 {req.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .user-dashboard {
          min-height: 100vh;
          background: #f0f2f5;
        }
        .dashboard-header {
          background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
          color: white;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left h1 { margin: 0; font-size: 1.5rem; }
        .establishment-name { opacity: 0.9; }
        .btn-logout {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        .dashboard-tabs {
          display: flex;
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 0 30px;
        }
        .tab {
          padding: 18px 25px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-size: 1rem;
        }
        .tab.active {
          border-bottom-color: #4caf50;
          color: #4caf50;
          font-weight: bold;
        }
        .dashboard-content { padding: 30px; }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .create-playlist {
          display: flex;
          gap: 10px;
        }
        .create-playlist input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .create-playlist button {
          background: #4caf50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
        }
        .playlist-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .playlist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .playlist-header h3 { margin: 0; color: #1a1a2e; }
        .btn-danger-small {
          background: #ffebee;
          color: #f44336;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        
        .songs-list {
          margin: 15px 0;
          max-height: 200px;
          overflow-y: auto;
        }
        .no-songs {
          color: #999;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
        .song-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #f5f5f5;
        }
        .song-item button {
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        
        .add-song-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .add-song-form input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .add-song-form button {
          background: #e3f2fd;
          color: #1976d2;
          border: none;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .empty-state, .empty-message {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 16px;
          color: #666;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #666;
        }
        .created-by { font-size: 0.8em; color: #888; margin-left: 8px; }
        
        .request-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .request-position {
          width: 40px;
          height: 40px;
          background: #4caf50;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .request-info { flex: 1; }
        .request-info h4 { margin: 0 0 5px 0; }
        .request-info p { margin: 0; color: #666; }
        .request-info .message {
          margin-top: 10px;
          padding: 10px;
          background: #fff9e6;
          border-radius: 8px;
          font-style: italic;
        }
        
        .requests-panel h2 { margin-bottom: 20px; }
        .requests-panel h3 { margin: 30px 0 15px 0; color: #333; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #1a1a2e;
        }
        .stat-label {
          color: #666;
          font-size: 0.9rem;
          margin-top: 5px;
        }
        .stat-total .stat-number { color: #1976d2; }
        .stat-pending .stat-number { color: #ff9800; }
        .stat-validated .stat-number { color: #4caf50; }
        .stat-rejected .stat-number { color: #f44336; }
        
        .request-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .btn-validate {
          background: #4caf50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }
        .btn-reject {
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .selfie-thumbnail {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          margin-top: 10px;
          border: 2px solid #e0e0e0;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: white;
          padding: 30px;
          border-radius: 16px;
          max-width: 400px;
          width: 90%;
        }
        .modal h3 { margin-top: 0; }
        .modal textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 15px 0;
          font-family: inherit;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .modal-actions button {
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
        }
        .modal-actions button:first-child {
          background: #e0e0e0;
          color: #333;
        }
        
        .yt-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .yt-modal {
          background: white;
          padding: 20px;
          border-radius: 12px;
          width: 90%;
          max-width: 450px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .yt-modal h3 {
          margin: 0 0 15px;
          text-align: center;
        }
        .yt-search-form {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .yt-search-form input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
        .yt-search-form button {
          padding: 10px 14px;
          background: #ff0000;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .yt-results {
          flex: 1;
          overflow-y: auto;
          max-height: 350px;
        }
        .yt-result-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #f9f9f9;
          border: none;
          border-radius: 6px;
          margin-bottom: 6px;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .yt-result-item:hover { background: #f0f0f0; }
        .yt-result-item img {
          width: 70px;
          height: 45px;
          object-fit: cover;
          border-radius: 4px;
        }
        .yt-result-info { flex: 1; min-width: 0; }
        .yt-result-title {
          font-size: 12px;
          font-weight: 500;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .yt-result-channel { font-size: 10px; color: #666; }
        .yt-no-results {
          text-align: center;
          color: #999;
          padding: 15px;
        }
        .yt-close-btn {
          margin-top: 12px;
          width: 100%;
          padding: 10px;
          background: #eee;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default UserDashboard;
