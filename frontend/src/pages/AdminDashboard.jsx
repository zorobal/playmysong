import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API_URL from "../config";

function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("requests");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [validatedRequests, setValidatedRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [stats, setStats] = useState({ total: 0, validated: 0, rejected: 0 });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", phoneNumber: "" });
  const [newPlaylist, setNewPlaylist] = useState({ name: "" });
  const [newMusic, setNewMusic] = useState({ title: "", artist: "" });
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, reason: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const accessToken = localStorage.getItem("token");
  const establishmentId = admin?.establishmentId;

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }
    loadInitialData();
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!establishmentId) return;

    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true
    });

    socket.on("connect", () => {
      socket.emit("join_establishment", establishmentId);
    });

    socket.on("new_request", (data) => {
      setPendingRequests(prev => [...prev, data.request || data]);
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
    });

    socket.on("request_validated", ({ requestId }) => {
      const request = pendingRequests.find(r => r.id === requestId);
      if (request) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        setValidatedRequests(prev => [...prev, { ...request, status: "VALIDATED" }]);
        setStats(prev => ({ ...prev, validated: prev.validated + 1 }));
      }
    });

    socket.on("request_rejected", ({ requestId }) => {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      setStats(prev => ({ ...prev, rejected: prev.rejected + 1 }));
    });

    socket.on("now_playing_updated", (song) => {
      setNowPlaying(song);
    });

    socket.on("request_completed", ({ requestId }) => {
      setValidatedRequests(prev => prev.filter(r => r.id !== requestId));
    });

    socket.on("playlist_updated", () => {
      loadPlaylist();
    });

    return () => socket.disconnect();
  }, [establishmentId, pendingRequests]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const adminRes = await fetch(`${API_URL}/admins/me`, { headers });
      const adminData = await adminRes.json();
      
      if (!adminData || adminData.error) {
        setLoading(false);
        return;
      }

      setAdmin(adminData);

      if (adminData.establishmentId) {
        const usersRes = await fetch(`${API_URL}/users?establishmentId=${adminData.establishmentId}`, { headers });
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);

        const playlistsRes = await fetch(`${API_URL}/playlists?establishmentId=${adminData.establishmentId}`, { headers });
        const playlistsData = await playlistsRes.json();
        setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);

        const requestsRes = await fetch(`${API_URL}/request/pending?establishmentId=${adminData.establishmentId}`, { headers });
        const requestsData = await requestsRes.json();
        setPendingRequests(Array.isArray(requestsData) ? requestsData : []);

        const playlistRes = await fetch(`${API_URL}/request/playlist/current?establishmentId=${adminData.establishmentId}`);
        const playlistData = await playlistRes.json();
        setNowPlaying(playlistData.nowPlaying);
        setValidatedRequests(playlistData.queue || []);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlaylist() {
    if (!establishmentId) return;
    try {
      const res = await fetch(`${API_URL}/request/playlist/current?establishmentId=${establishmentId}`);
      const data = await res.json();
      setNowPlaying(data.nowPlaying);
      setValidatedRequests(data.queue || []);
    } catch (err) {
      console.error("Erreur playlist:", err);
    }
  }

  async function validateRequest(requestId) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/request/${requestId}/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const request = pendingRequests.find(r => r.id === requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      if (request) {
        setValidatedRequests(prev => [...prev, { ...request, status: "VALIDATED" }]);
      }
    } catch (err) {
      alert("Erreur lors de la validation");
    }
  }

  async function rejectRequest() {
    const { requestId, reason } = rejectModal;
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/request/${requestId}/reject`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      });
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      setRejectModal({ open: false, requestId: null, reason: "" });
    } catch (err) {
      alert("Erreur lors du rejet");
    }
  }

  async function setNowPlayingSong(song) {
    setNowPlaying(song);
  }

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);

  async function handleFileSelect(playlistId) {
    setCurrentPlaylistId(playlistId);
    setShowUploadModal(true);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="admin-dashboard">
      {showUploadModal && (
        <YouTubeUploadModal
          playlistId={currentPlaylistId}
          onClose={() => setShowUploadModal(false)}
          onUpload={() => {
            setShowUploadModal(false);
            loadInitialData();
          }}
        />
      )}

      <header className="dashboard-header">
        <div className="header-left">
          <h1>PlayMySong Admin</h1>
          <span className="establishment-name">{admin?.establishment?.name || "Établissement"}</span>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          📩 Demandes ({pendingRequests.length})
        </button>
        <button 
          className={`tab ${activeTab === "playlist" ? "active" : ""}`}
          onClick={() => setActiveTab("playlist")}
        >
          📁 Playlist
        </button>
        <button 
          className={`tab ${activeTab === "playlistEtab" ? "active" : ""}`}
          onClick={() => setActiveTab("playlistEtab")}
        >
          🎼 Playlist Établissement
        </button>
        <button 
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Utilisateurs
        </button>
        <button 
          className={`tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          📊 Statistiques
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === "requests" && (
          <div className="requests-panel">
            <div className="now-playing-bar">
              <h3>🎶 En cours</h3>
              {nowPlaying ? (
                <div className="now-playing-info">
                  <strong>{nowPlaying.title}</strong>
                  <span>{nowPlaying.artist}</span>
                </div>
              ) : (
                <span className="no-music">Aucune chanson</span>
              )}
            </div>

            <h2>Demandes en attente ({pendingRequests.length})</h2>
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
                        <img src={req.selfieUrl} alt="Selfie" className="selfie-thumb" />
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
                        onClick={() => setRejectModal({ open: true, requestId: req.id, reason: "" })}
                      >
                        ❌ Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "playlist" && (
          <div className="playlist-panel">
            <h2>Gestion Playlist - {admin?.establishment?.name || 'Établissement'}</h2>
            
            <div className="create-playlist">
              <input 
                placeholder="Nom de la playlist"
                value={newPlaylist.name}
                onChange={e => setNewPlaylist({ name: e.target.value })}
              />
              <button onClick={async () => {
                const token = localStorage.getItem("token");
                if (!token) {
                  alert("Session expirée. Veuillez vous reconnecter.");
                  navigate("/login");
                  return;
                }
                if (!establishmentId || establishmentId === 'null' || establishmentId === 'undefined') {
                  alert("Erreur: Votre compte n'est pas lié à un établissement. Veuillez contacter l'administrateur.");
                  console.log("Admin data:", admin);
                  return;
                }
                const playlistData = {
                  name: newPlaylist.name,
                  establishmentId: establishmentId,
                  createdBy: admin?.id
                };
                console.log("Creating playlist:", playlistData);
                const res = await fetch(`${API_URL}/playlists`, {
                  method: "POST",
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(playlistData)
                });
                console.log("Playlist response:", res.status);
                if (res.ok) {
                  setNewPlaylist({ name: "" });
                  // Refresh playlists
                  const playlistsRes = await fetch(`${API_URL}/playlists?establishmentId=${establishmentId}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                  });
                  const playlistsData = await playlistsRes.json();
                  setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);
                } else {
                  const err = await res.json();
                  alert("Erreur: " + (err.error || "Inconnu"));
                }
              }}>Créer</button>
            </div>

            <div className="playlists-list">
              {playlists.map(pl => (
                <div key={pl.id} className="playlist-card">
                  <div className="playlist-header">
                    <h4>🎶 {pl.name} {pl.createdBy && <span className="created-by">par: {pl.createdBy}</span>}</h4>
                    <button onClick={async () => {
                      const token = localStorage.getItem("token");
                      await fetch(`${API_URL}/playlists/${pl.id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      loadInitialData();
                    }}>Supprimer</button>
                  </div>
                  <ul className="songs-list">
                    {(pl.songs || []).map(song => (
                      <li key={song.id}>
                        {song.title} - {song.artist}
                        <button onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch(`${API_URL}/playlists/${pl.id}/musics/${song.id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          loadInitialData();
                        }}>×</button>
                      </li>
                    ))}
                  </ul>
                  <div className="add-song">
                    <input 
                      placeholder="Titre"
                      onChange={e => setNewMusic({ ...newMusic, title: e.target.value })}
                    />
                    <input 
                      placeholder="Artiste"
                      onChange={e => setNewMusic({ ...newMusic, artist: e.target.value })}
                    />
                    <button onClick={async () => {
                      const token = localStorage.getItem("token");
                      await fetch(`${API_URL}/playlists/${pl.id}/musics`, {
                        method: "POST",
                        headers: { 
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify(newMusic)
                      });
                      setNewMusic({ title: "", artist: "" });
                      loadInitialData();
                    }}>+</button>
                    <button onClick={() => handleFileSelect(pl.id)} title="Ajouter une chanson">➕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "playlistEtab" && (
          <div className="playlist-panel">
            <h2>🎼 Playlist Établissement - {admin?.establishment?.name || 'Établissement'}</h2>
            <p style={{marginBottom: 20, color: '#666'}}>
              Cette playlist est jouée automatiquement quand la file d'attente est vide.
            </p>
            
            {playlists.length === 0 ? (
              <div style={{textAlign: 'center', padding: 40}}>
                <p>Aucune playlist trouvée.</p>
                <p>Créez d'abord une playlist dans l'onglet "Playlist"</p>
              </div>
            ) : (
              <div className="playlists-list">
                {playlists.map(pl => (
                  <div key={pl.id} className="playlist-card" style={{marginBottom: 20, padding: 15, background: '#f9f9f9', borderRadius: 12}}>
                    <div className="playlist-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                      <h3 style={{margin: 0}}>{pl.name}</h3>
                      <span style={{fontSize: '0.85rem', color: '#666'}}>{pl.songs?.length || 0} chanson(s)</span>
                    </div>
                    
                    <div className="playlist-songs">
                      {(pl.songs || []).map(song => (
                        <div key={song.id} className="playlist-song-item" style={{display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee'}}>
                          {song.thumbnail && <img src={song.thumbnail} alt="" style={{width: 50, height: 50, borderRadius: 8, objectFit: 'cover'}} />}
                          <div style={{flex: 1, minWidth: 0}}>
                            <p style={{fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{song.title}</p>
                            <p style={{fontSize: '0.85rem', color: '#666', margin: 0}}>{song.artist || 'Artiste inconnu'}</p>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!confirm('Supprimer cette chanson ?')) return;
                              const token = localStorage.getItem("token");
                              await fetch(`${API_URL}/songs/${song.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              loadInitialData();
                            }}
                            style={{background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer'}}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      {(!pl.songs || pl.songs.length === 0) && (
                        <p style={{color: '#999', textAlign: 'center', padding: 20}}>Aucune chanson dans cette playlist</p>
                      )}
                    </div>
                    
                    <div style={{marginTop: 15}}>
                      <button 
                        onClick={() => handleFileSelect(pl.id)} 
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        ➕ Ajouter une chanson YouTube
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-panel">
            <h2>Utilisateurs ({users.length})</h2>
            
            <div className="add-user-form">
              <input placeholder="Nom" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              <input placeholder="Mot de passe" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
              <input placeholder="Téléphone" value={newUser.phoneNumber} onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })} />
              <button onClick={async () => {
                if (!establishmentId) {
                  alert("Erreur: Pas d'établissement associé");
                  return;
                }
                const token = localStorage.getItem("token");
                const userData = {
                  ...newUser,
                  role: "USER",
                  establishmentId: establishmentId,
                  createdBy: admin?.id
                };
                const res = await fetch(`${API_URL}/users`, {
                  method: "POST",
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(userData)
                });
                const data = await res.json();
                console.log("Create user response:", data);
                if (res.ok) {
                  setNewUser({ name: "", email: "", password: "", phoneNumber: "" });
                  // Refresh users list
                  const usersRes = await fetch(`${API_URL}/users?establishmentId=${establishmentId}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                  });
                  const usersData = await usersRes.json();
                  setUsers(Array.isArray(usersData) ? usersData : []);
                } else {
                  alert("Erreur: " + (data.error || "Inconnu"));
                }
              }}>Ajouter</button>
            </div>

            <ul className="users-list">
              {users.map(u => (
                <li key={u.id}>
                  <span>👤 {u.name} ({u.email}) {u.createdBy && <span className="created-by">Créé par: {u.createdBy}</span>}</span>
                  <button onClick={async () => {
                    const token = localStorage.getItem("token");
                    await fetch(`${API_URL}/users/${u.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    loadInitialData();
                  }}>Supprimer</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="stats-panel">
            <h2>Statistiques</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{pendingRequests.length + validatedRequests.length}</div>
                <div className="stat-label">Total demandes</div>
              </div>
              <div className="stat-card validated">
                <div className="stat-value">{validatedRequests.length}</div>
                <div className="stat-label">Validées</div>
              </div>
              <div className="stat-card pending">
                <div className="stat-value">{pendingRequests.length}</div>
                <div className="stat-label">En attente</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{playlists.length}</div>
                <div className="stat-label">Playlists</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {rejectModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Rejeter la demande</h3>
            <textarea
              placeholder="Motif du rejet (optionnel)"
              value={rejectModal.reason}
              onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
            />
            <div className="modal-actions">
              <button onClick={() => setRejectModal({ open: false, requestId: null, reason: "" })}>
                Annuler
              </button>
              <button className="btn-reject" onClick={rejectRequest}>
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .establishment-name {
          opacity: 0.9;
        }
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
          padding: 0 20px;
        }
        .tab {
          padding: 15px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-size: 0.95rem;
        }
        .tab.active {
          border-bottom-color: #667eea;
          color: #667eea;
          font-weight: bold;
        }
        .dashboard-content {
          padding: 30px;
        }
        .now-playing-bar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .now-playing-bar h3 { margin: 0 0 10px 0; }
        .now-playing-info strong { font-size: 1.2rem; }
        .no-music { opacity: 0.7; }
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
          background: #667eea;
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
        .selfie-thumb {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          margin-top: 10px;
        }
        .request-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-validate {
          background: #4caf50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-reject {
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        .playlist-card, .users-panel, .stats-panel {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .playlist-song-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #667eea;
        }
        .stat-card.validated .stat-value { color: #4caf50; }
        .stat-card.pending .stat-value { color: #ff9800; }
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
        }
        .modal {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
        }
        .modal textarea {
          width: 100%;
          height: 100px;
          margin: 15px 0;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .empty-message {
          text-align: center;
          color: #999;
          padding: 40px;
        }
        .created-by { font-size: 0.8em; color: #888; margin-left: 8px; }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #666;
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
        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .modal-content h2 {
          margin: 0 0 20px;
          color: #333;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #555;
          font-weight: 500;
        }
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }
        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .btn-cancel {
          flex: 1;
          padding: 10px;
          background: #f0f0f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-submit {
          flex: 1;
          padding: 10px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function YouTubeUploadModal({ playlistId, onClose, onUpload }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const token = localStorage.getItem("token");

  const searchYouTube = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/youtube/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  };

  const addToPlaylist = async (video) => {
    setAdding(video.id.videoId);
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: video.snippet.title,
          artist: video.snippet.channelTitle,
          youtubeId: video.id.videoId,
          thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
          filePath: null
        })
      });
      
      if (res.ok) {
        onUpload();
      } else {
        alert("Erreur lors de l'ajout");
      }
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
    setAdding(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content youtube-modal" onClick={e => e.stopPropagation()}>
        <h2>🎵 Rechercher sur YouTube</h2>
        
        <form onSubmit={searchYouTube} className="search-form">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une chanson..."
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : '🔍'}
          </button>
        </form>

        <div className="results-list">
          {results.map((video) => (
            <button
              key={video.id.videoId}
              className="result-item"
              onClick={() => addToPlaylist(video)}
              disabled={adding === video.id.videoId}
            >
              <img 
                src={video.snippet.thumbnails?.medium?.url} 
                alt={video.snippet.title}
              />
              <div className="result-info">
                <p className="result-title">{video.snippet.title}</p>
                <p className="result-channel">{video.snippet.channelTitle}</p>
              </div>
              <span className="add-btn">
                {adding === video.id.videoId ? '⏳' : '➕'}
              </span>
            </button>
          ))}
          
          {results.length === 0 && !loading && search && (
            <p className="no-results">Aucun résultat</p>
          )}
        </div>

        <button className="btn-close" onClick={onClose}>Fermer</button>

        <style>{`
          .youtube-modal {
            max-width: 500px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
          }
          .search-form {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
          }
          .search-form input {
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
          }
          .search-form button {
            padding: 12px 16px;
            background: #ff0000;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          }
          .results-list {
            flex: 1;
            overflow-y: auto;
            max-height: 400px;
          }
          .result-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            background: #f9f9f9;
            border: none;
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            text-align: left;
            width: 100%;
          }
          .result-item:hover {
            background: #f0f0f0;
          }
          .result-item img {
            width: 80px;
            height: 50px;
            object-fit: cover;
            border-radius: 4px;
          }
          .result-info {
            flex: 1;
            min-width: 0;
          }
          .result-title {
            font-size: 13px;
            font-weight: 500;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .result-channel {
            font-size: 11px;
            color: #666;
          }
          .add-btn {
            font-size: 18px;
          }
          .no-results {
            text-align: center;
            color: #999;
            padding: 20px;
          }
          .btn-close {
            margin-top: 15px;
            width: 100%;
            padding: 12px;
            background: #eee;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}

export default AdminDashboard;
