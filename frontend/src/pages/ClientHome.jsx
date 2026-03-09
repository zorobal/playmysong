import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

export default function ClientHome() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const establishmentId = searchParams.get("establishmentId");

  useEffect(() => {
    if (establishmentId) {
      navigate(`/request?establishmentId=${establishmentId}`);
    }
  }, [establishmentId, navigate]);

  return (
    <main style={{ padding: 20, textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 10 }}>🎵 PlayMySong</h1>
      <p style={{ marginBottom: 30 }}>La musique collaborative pour votre établissement</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 15, maxWidth: 300, margin: "0 auto" }}>
        <Link to="/request">
          <button style={{ padding: "15px 20px", fontSize: "1rem", width: "100%" }}>
            🔍 Rechercher & Proposer
          </button>
        </Link>
        
        <Link to="/playlist">
          <button style={{ padding: "15px 20px", fontSize: "1rem", width: "100%" }}>
            📋 Voir la playlist
          </button>
        </Link>
      </div>

      <div style={{ marginTop: 40, fontSize: "0.85rem", color: "#666" }}>
        <p>Scannez le QR Code de votre établissement pour une expérience personnalisée</p>
      </div>
    </main>
  );
}
