import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API_URL from "../config";

function OperatorDashboard() {
  const [admin, setAdmin] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
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
    });

    socket.on("request_validated", ({ requestId }) => {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    });

    socket.on("request_rejected", ({ requestId }) => {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    });

    socket.on("now_playing_updated", (song) => {
      setNowPlaying(song);
    });

    socket.on("playlist_updated", () => {
      loadPlaylist();
    });

    return () => socket.disconnect();
  }, [establishmentId]);

  async function loadInitialData() {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };

      const [adminData, requestsData] = await Promise.all([
        fetch(`${API_URL}/admins/me`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/request/pending`, { headers }).then(r => r.json())
      ]);

      setAdmin(adminData);
      setPendingRequests(Array.isArray(requestsData) ? requestsData : []);

      if (adminData.establishmentId) {
        const playlistRes = await fetch(`${API_URL}/request/playlist/current?establishmentId=${adminData.establishmentId}`);
        const playlistData = await playlistRes.json();
        setNowPlaying(playlistData.nowPlaying);
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
    } catch (err) {
      console.error("Erreur playlist:", err);
    }
  }

  async function validateRequest(requestId) {
    try {
      await fetch(`${API_URL}/request/${requestId}/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const request = pendingRequests.find(r => r.id === requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      alert("Erreur lors de la validation");
    }
  }

  async function rejectRequest(requestId) {
    const reason = prompt("Motif du rejet (optionnel):");
    try {
      await fetch(`${API_URL}/request/${requestId}/reject`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      });
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      alert("Erreur lors du rejet");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="operator-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎵 PlayMySong</h1>
          <span className="establishment-name">{admin?.establishment?.name || "Établissement"}</span>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main className="dashboard-content">
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
                    onClick={() => rejectRequest(req.id)}
                  >
                    ❌ Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        .operator-dashboard {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .dashboard-header {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
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
        .dashboard-content { padding: 30px; }
        .now-playing-bar {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
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
          background: #ff9800;
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
        .empty-message {
          text-align: center;
          color: #999;
          padding: 40px;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #666;
        }
      `}</style>
    </div>
  );
}

export default OperatorDashboard;
