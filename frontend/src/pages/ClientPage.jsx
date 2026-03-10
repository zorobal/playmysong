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
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result);
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
      if (selectedSong.duration) {
        formData.append("durationSec", selectedSong.duration);
      }
      
      if (message.trim()) {
        formData.append("message", message.trim());
      }
      
      if (selfieFile) {
        formData.append("selfie", selfieFile);
      }

      const res = await fetch(`${API_URL}/request`, {
        method: "POST",
        body: formData,
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
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 text-center max-w-md w-full">
          <p className="text-xs font-bold tracking-wider text-pink-400 mb-2">PlayMySong</p>
          <div className="mb-8">
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-bounce">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Demande Envoyée!
            </h1>
            
            <p className="text-slate-300 text-lg mb-6">
              Votre demande sera bientôt validée par l'établissement.
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-5 mb-8 border border-amber-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-amber-400 font-semibold">Pour une nouvelle demande, scannez à nouveau le QR code</p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-slate-600 text-sm text-center relative z-10">
          <p className="font-medium">{establishmentName}</p>
          {establishmentType && <p className="text-xs mt-1">{establishmentType}</p>}
        </div>

        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            animation: gradient 3s ease infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-28 md:pb-8">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
      <div className="md:max-w-2xl md:mx-auto md:py-4">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-pink-400 font-bold tracking-wider">PlayMySong</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Connecté</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {establishmentName}
              </h1>
            </div>
            
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>

          <p className="text-slate-400 text-xs mt-2">
            Choisissez une chanson et partagez-la avec tous!
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center justify-between animate-slide-up">
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-2 p-1 hover:bg-red-500/30 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Beautiful Tabs */}
      <div className="px-4 mt-4">
        <div className="flex bg-slate-800/80 rounded-2xl p-1 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("playlist")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === "playlist" 
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25" 
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Playlist
          </button>
          <button
            onClick={() => setActiveTab("youtube")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === "youtube" 
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25" 
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === "playlist" && (
          <>
            {/* Playlist Pills */}
            {playlists.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                {playlists.map((playlist, index) => (
                  <button
                    key={playlist.id}
                    onClick={() => selectPlaylist(playlist)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedPlaylist?.id === playlist.id
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {playlist.name}
                  </button>
                ))}
              </div>
            )}

            {/* Songs Grid */}
            <div className="space-y-3">
              {playlistSongs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <p className="text-slate-500">Aucune chanson dans cette playlist</p>
                  <p className="text-slate-600 text-sm mt-1">Essayez l'onglet YouTube</p>
                </div>
              ) : (
                playlistSongs.map((song, index) => (
                  <button
                    key={song.id}
                    onClick={() => {
                      setSelectedSong(song);
                      setShowForm(true);
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 animate-slide-up ${
                      selectedSong?.id === song.id && showForm
                        ? "bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-2 border-pink-500 shadow-lg shadow-pink-500/10"
                        : "bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {song.thumbnail ? (
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold truncate text-white">{song.title || "Sans titre"}</p>
                      <p className="text-sm text-slate-400 truncate">{song.artist || "Artiste inconnu"}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      selectedSong?.id === song.id && showForm
                        ? "bg-pink-500 text-white"
                        : "bg-slate-700 text-slate-500 group-hover:bg-pink-500/20"
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "youtube" && (
          <>
            {/* Search Form */}
            <form onSubmit={searchYoutube} className="mb-5">
              <div className="relative">
                <input
                  type="text"
                  value={youtubeSearch}
                  onChange={(e) => setYoutubeSearch(e.target.value)}
                  placeholder="Rechercher une chanson..."
                  className="w-full p-4 pr-14 bg-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-slate-750 border border-slate-700/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !youtubeSearch.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* YouTube Results */}
            <div className="space-y-3">
              {youtubeResults.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <p className="text-slate-500">Recherchez une chanson sur YouTube</p>
                  <p className="text-slate-600 text-sm mt-1">Tapez le titre ou l'artiste</p>
                </div>
              )}
              {youtubeResults.map((video, index) => (
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
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all duration-300 animate-slide-up ${
                    selectedSong?.youtubeId === video.id.videoId && showForm
                      ? "bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-2 border-pink-500"
                      : "bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50"
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={video.snippet.thumbnails?.medium?.url || ""}
                      alt={video.snippet.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-slate-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate text-white">{video.snippet.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-1">{video.snippet.channelTitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Elements */}
      <>
        {/* Bottom Floating Card */}
        {selectedSong && showForm && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700 rounded-t-3xl shadow-2xl border-t border-slate-600/50 z-[9999] max-h-[85vh] overflow-y-auto backdrop-blur-sm">
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-500 rounded-full mx-auto mt-3 mb-4"></div>
            
            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-600/30">
              <h3 className="text-lg font-bold text-white text-center">Demander cette chanson</h3>
            </div>
            
            {/* Selected Song Info */}
            <div className="px-6 py-4 bg-slate-800/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500/30 to-purple-600/30 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                  {selectedSong.thumbnail ? (
                    <img src={selectedSong.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-lg truncate">{selectedSong.title}</p>
                  <p className="text-slate-300 truncate">{selectedSong.artist || "Artiste inconnu"}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSong(null);
                    setShowForm(false);
                  }}
                  className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6 space-y-5">
              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message personnalisé (optionnel)
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Joyeux anniversaire, dédicace spéciale..."
                    maxLength={100}
                    className="w-full p-4 pl-12 bg-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-slate-600/50 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">{message.length}/100</span>
                </div>
              </div>

              {/* Selfie Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Photo souvenir (optionnel)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieChange}
                  className="hidden"
                  id="selfie-input"
                />
                
                {!selfiePreview ? (
                  <label
                    htmlFor="selfie-input"
                    className="block w-full py-4 bg-slate-700/70 rounded-xl text-center text-slate-300 hover:bg-slate-700 cursor-pointer flex items-center justify-center gap-3 transition-all border border-slate-600/50 border-dashed hover:border-pink-500/50"
                  >
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Ajouter une photo</span>
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={selfiePreview}
                      alt="Selfie preview"
                      className="w-32 h-32 object-cover rounded-xl mx-auto shadow-lg"
                    />
                    <button
                      onClick={removeSelfie}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500 focus:ring-offset-0" 
                />
                <span className="text-sm text-slate-300">
                  J'accepte que ma photo soit affichée sur l'écran de l'établissement pour partager ce moment spécial
                </span>
              </label>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedSong(null);
                    setShowForm(false);
                    setError("");
                  }}
                  className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium text-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitRequest}
                  disabled={loading || !consent}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-size-200 animate-gradient rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Envoyer la demande
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tip */}
        {!showForm && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm py-3 px-4 text-center border-t border-slate-600/30">
            <p className="text-sm text-slate-400">
              Scannez le QR Code pour demander une chanson 🎵
            </p>
          </div>
        )}
      </>

      {/* Bottom Tip */}
      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm py-2 px-4 text-center">
          <p className="text-xs text-slate-500">
            Scannez le QR Code pour demander une chanson
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
