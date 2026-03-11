import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API_URL, { SOCKET_URL } from "../config";

export default function ClientPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const establishmentId = searchParams.get("establishmentId");
  const [establishmentName, setEstablishmentName] = useState("");
  const [establishmentType, setEstablishmentType] = useState("");
  
  const [activeTab, setActiveTab] = useState("playlist");
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [message, setMessage] = useState("");
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [consent, setConsent] = useState(true);
  
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!establishmentId) {
      setError("QR Code invalide. Veuillez scanner le QR Code de l'établissement.");
      return;
    }

    const existingRequest = localStorage.getItem(`pms_request_${establishmentId}`);
    if (existingRequest) {
      try {
        const reqData = JSON.parse(existingRequest);
        setSuccess(true);
        setEstablishmentName(reqData.establishmentName || "Établissement");
        setEstablishmentType(reqData.establishmentType || "");
        return;
      } catch (e) {
        localStorage.removeItem(`pms_request_${establishmentId}`);
      }
    }

    fetchEstablishment();

    socketRef.current = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join_establishment", establishmentId);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    try {
      const res = await fetch(`${API_URL}/establishments/public/${establishmentId}`);
      const data = await res.json();
      setEstablishmentName(data.name || "Établissement");
      setEstablishmentType(data.type || "");
    } catch (err) {
      console.error("Erreur chargement établissement:", err);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${API_URL}/playlists/public?establishmentId=${establishmentId}`);
      const data = await res.json();
      setPlaylists(data);
      if (data.length > 0) {
        setSelectedPlaylist(data[0]);
        setPlaylistSongs(data[0].songs || []);
      }
    } catch (err) {
      console.error("Erreur chargement playlists:", err);
    }
  };

  useEffect(() => {
    if (establishmentId) {
      fetchPlaylists();
    }
  }, [establishmentId]);

  const selectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistSongs(playlist.songs || []);
    setSelectedSong(null);
  };

  const searchYoutube = async (e) => {
    e.preventDefault();
    if (!youtubeSearch.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/youtube/search?q=${encodeURIComponent(youtubeSearch)}`);
      const data = await res.json();
      setYoutubeResults(data.items || []);
    } catch (err) {
      console.error("Erreur recherche YouTube:", err);
      setError("Erreur lors de la recherche YouTube");
    }
    setLoading(false);
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Photo trop volumineuse (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result);
        setError("");
      };
      reader.onerror = () => {
        setError("Erreur lors du chargement de la photo");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelfie = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitRequest = async () => {
    if (!selectedSong) {
      setError("Veuillez sélectionner une chanson");
      return;
    }

    if (!selectedSong.title) {
      setError("Le titre de la chanson est manquant");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        establishmentId,
        title: selectedSong.title,
        artist: selectedSong.artist || "",
        youtubeId: selectedSong.youtubeId || null,
        filePath: selectedSong.filePath || null,
        durationSec: selectedSong.duration || 0,
        message: message.trim() || null,
        selfieUrl: selfiePreview || null
      };

      const res = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Server error response:", data);
        throw new Error(data.error || "Erreur lors de l'envoi de la demande");
      }

      if (socketRef.current) {
        socketRef.current.emit("request_song", {
          establishmentId,
          title: selectedSong.title,
          artist: selectedSong.artist,
          youtubeId: selectedSong.youtubeId,
          message: message.trim(),
        });
      }

      localStorage.setItem(`pms_request_${establishmentId}`, JSON.stringify({
        title: selectedSong.title,
        artist: selectedSong.artist,
        youtubeId: selectedSong.youtubeId,
        filePath: selectedSong.filePath,
        message: message.trim(),
        selfiePreview: selfiePreview,
        establishmentName: establishmentName,
        establishmentType: establishmentType,
        timestamp: Date.now()
      }));

      setSuccess(true);
    } catch (err) {
      console.error("Erreur soumission:", err);
      setError(err.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedSong(null);
    setShowForm(false);
    setMessage("");
    setSelfieFile(null);
    setSelfiePreview(null);
    setYoutubeSearch("");
    setYoutubeResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (success) {
    const savedRequest = (() => {
      try {
        return JSON.parse(localStorage.getItem(`pms_request_${establishmentId}`));
      } catch { return null; }
    })();

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 40px rgba(16,185,129,0.4)'
          }}>
            <svg style={{width:'40px',height:'40px',color:'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 style={{fontSize:'28px',fontWeight:'bold',color:'white',marginBottom:'8px'}}>
            Demande Envoyée!
          </h1>
          <p style={{color:'#cbd5e1',marginBottom:'24px'}}>
            Votre demande sera bientôt validée.
          </p>

          {savedRequest && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              <h3 style={{color:'#fbbf24',fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>Votre demande:</h3>
              <p style={{color:'white',marginBottom:'4px'}}><strong>{savedRequest.title}</strong></p>
              {savedRequest.artist && <p style={{color:'#94a3b8',fontSize:'14px',marginBottom:'8px'}}>{savedRequest.artist}</p>}
              {savedRequest.message && <p style={{color:'#e2e8f0',fontSize:'14px',fontStyle:'italic',marginBottom:'8px'}}>"{savedRequest.message}"</p>}
              {savedRequest.selfiePreview && (
                <img src={savedRequest.selfiePreview} alt="Votre selfie" style={{width:'80px',height:'80px',objectFit:'cover',borderRadius:'12px',marginTop:'12px'}} />
              )}
            </div>
          )}

          <button
            onClick={() => {
              localStorage.removeItem(`pms_request_${establishmentId}`);
              setSuccess(false);
              setSelectedSong(null);
              setShowForm(false);
              setMessage("");
              setSelfieFile(null);
              setSelfiePreview(null);
              setError("");
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            ➕ Nouvelle demande
          </button>

          <p style={{color:'#64748b',fontSize:'12px',marginTop:'24px'}}>{establishmentName}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed, #db2777)',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h1 style={{fontSize:'18px',fontWeight:'bold'}}>🎵 {establishmentName}</h1>
            {establishmentType && <p style={{fontSize:'12px',opacity:0.9}}>{establishmentType}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',padding:'12px 16px',gap:'8px'}}>
        <button
          onClick={() => {setActiveTab("playlist"); setSelectedSong(null); setShowForm(false);}}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === "playlist" ? 'linear-gradient(135deg, #7c3aed, #db2777)' : '#1e293b',
            color: activeTab === "playlist" ? 'white' : '#94a3b8'
          }}
        >
          📋 Playlist
        </button>
        <button
          onClick={() => {setActiveTab("youtube"); setSelectedSong(null); setShowForm(false);}}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === "youtube" ? 'linear-gradient(135deg, #7c3aed, #db2777)' : '#1e293b',
            color: activeTab === "youtube" ? 'white' : '#94a3b8'
          }}
        >
          ▶️ YouTube
        </button>
      </div>

      {/* Playlist Tabs */}
      {activeTab === "playlist" && playlists.length > 1 && (
        <div style={{display:'flex',gap:'8px',padding:'0 16px 12px',overflowX:'auto'}}>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => selectPlaylist(pl)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                background: selectedPlaylist?.id === pl.id ? '#db2777' : '#334155',
                color: 'white'
              }}
            >
              {pl.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{padding: '16px', paddingBottom: showForm ? '400px' : '80px'}}>
        {activeTab === "playlist" && (
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {playlistSongs.length === 0 ? (
              <div style={{textAlign:'center',padding:'40px 20px',color:'#64748b'}}>
                <p>Aucune chanson dans cette playlist</p>
              </div>
            ) : (
              playlistSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => {setSelectedSong(song); setShowForm(true);}}
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:'12px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: selectedSong?.id === song.id && showForm ? '2px solid #db2777' : 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedSong?.id === song.id && showForm ? 'rgba(219,39,119,0.2)' : '#1e293b'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg style={{width:'24px',height:'24px',color:'#94a3b8'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:'white',fontSize:'14px',fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {song.title}
                    </p>
                    <p style={{color:'#94a3b8',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {song.artist || 'Artiste inconnu'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === "youtube" && (
          <>
            <form onSubmit={searchYoutube} style={{marginBottom:'16px'}}>
              <div style={{position:'relative'}}>
                <input
                  type="text"
                  value={youtubeSearch}
                  onChange={(e) => setYoutubeSearch(e.target.value)}
                  placeholder="Rechercher sur YouTube..."
                  style={{
                    width: '100%',
                    padding: '14px 50px 14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !youtubeSearch.trim()}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: loading ? '#475569' : 'linear-gradient(135deg, #7c3aed, #db2777)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '...' : '🔍'}
                </button>
              </div>
            </form>

            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {youtubeResults.map((video) => (
                <button
                  key={video.id.videoId}
                  onClick={() => {
                    setSelectedSong({
                      title: video.snippet.title,
                      artist: video.snippet.channelTitle,
                      youtubeId: video.id.videoId,
                      thumbnail: video.snippet.thumbnails?.medium?.url
                    });
                    setShowForm(true);
                  }}
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:'12px',
                    padding: '10px',
                    borderRadius: '12px',
                    border: selectedSong?.youtubeId === video.id.videoId && showForm ? '2px solid #db2777' : 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedSong?.youtubeId === video.id.videoId && showForm ? 'rgba(219,39,119,0.2)' : '#1e293b'
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: '80px',
                    height: '50px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={video.snippet.thumbnails?.medium?.url || ""}
                      alt=""
                      style={{width:'100%',height:'100%',objectFit:'cover'}}
                    />
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:'white',fontSize:'13px',fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {video.snippet.title}
                    </p>
                    <p style={{color:'#94a3b8',fontSize:'11px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {video.snippet.channelTitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Form Modal */}
      {showForm && selectedSong && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1e293b',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <div style={{padding:'20px'}}>
            {/* Handle */}
            <div style={{width:'40px',height:'4px',background:'#475569',borderRadius:'2px',margin:'0 auto 16px'}}></div>
            
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
              <h3 style={{fontSize:'18px',fontWeight:'bold',color:'white'}}>Votre demande</h3>
              <button
                onClick={() => {setSelectedSong(null); setShowForm(false);}}
                style={{
                  width:'32px',
                  height:'32px',
                  borderRadius:'50%',
                  border:'none',
                  background:'#334155',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              >
                <svg style={{width:'16px',height:'16px',color:'#94a3b8'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Song Info */}
            <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',background:'#0f172a',borderRadius:'12px',marginBottom:'16px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'8px',background:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg style={{width:'24px',height:'24px',color:'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div style={{flex:1}}>
                <p style={{color:'white',fontWeight:'600',fontSize:'14px'}}>{selectedSong.title}</p>
                <p style={{color:'#94a3b8',fontSize:'12px'}}>{selectedSong.artist || 'Artiste inconnu'}</p>
              </div>
            </div>

            {/* Message Input */}
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',color:'#94a3b8',fontSize:'13px',marginBottom:'8px'}}>
                Message (optionnel)
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Joyeux anniversaire, dédicace..."
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Selfie */}
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',color:'#94a3b8',fontSize:'13px',marginBottom:'8px'}}>
                Photo (optionnel)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSelfieChange}
                style={{display:'none'}}
                id="selfie-input"
              />
              
              {!selfiePreview ? (
                <label
                  htmlFor="selfie-input"
                  style={{
                    display: 'block',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '2px dashed #334155',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}
                >
                  📷 Ajouter une photo
                </label>
              ) : (
                <div style={{position:'relative',display:'inline-block'}}>
                  <img src={selfiePreview} alt="Preview" style={{width:'80px',height:'80px',objectFit:'cover',borderRadius:'10px'}} />
                  <button
                    onClick={removeSelfie}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width:'24px',
                      height:'24px',
                      borderRadius:'50%',
                      border:'none',
                      background:'#ef4444',
                      cursor:'pointer',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center'
                    }}
                  >
                    <svg style={{width:'12px',height:'12px',color:'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Consent */}
            <label style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'20px',cursor:'pointer'}}>
              <input 
                type="checkbox" 
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{marginTop:'3px'}}
              />
              <span style={{color:'#94a3b8',fontSize:'12px'}}>
                J'accepte que ma photo soit affichée sur l'écran
              </span>
            </label>

            {/* Error */}
            {error && (
              <div style={{padding:'12px',background:'rgba(239,68,68,0.2)',borderRadius:'10px',color:'#fca5a5',fontSize:'13px',marginBottom:'16px'}}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{display:'flex',gap:'12px'}}>
              <button
                onClick={() => {setSelectedSong(null); setShowForm(false); setError("");}}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#334155',
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={submitRequest}
                disabled={loading || !consent}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: loading || !consent ? '#475569' : 'linear-gradient(135deg, #7c3aed, #db2777)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading || !consent ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Envoi...' : '✅ Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tip */}
      {!showForm && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1e293b',
          padding: '12px',
          textAlign: 'center',
          borderTop: '1px solid #334155'
        }}>
          <p style={{color:'#64748b',fontSize:'12px'}}>
            Scannez le QR Code pour demander une chanson
          </p>
        </div>
      )}
    </div>
  );
}
