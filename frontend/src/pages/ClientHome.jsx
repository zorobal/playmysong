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
    <main style={{ 
      padding: 20, 
      textAlign: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
      color: "white",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: 10, marginTop: 40 }}>🎵 PlayMySong</h1>
      <p style={{ marginBottom: 40, color: "#cbd5e1" }}>La musique collaborative pour votre établissement</p>
      
      <div style={{ 
        background: "rgba(255,255,255,0.1)", 
        borderRadius: "20px", 
        padding: "30px",
        marginBottom: 30,
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: 20 }}>📱</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 15 }}>Comment ça marche ?</h2>
        <ol style={{ textAlign: "left", paddingLeft: 20, lineHeight: 2, color: "#e2e8f0" }}>
          <li>Scannez le QR Code affiché dans votre établissement</li>
          <li> Recherchez une chanson sur YouTube</li>
          <li>Envoyez votre demande</li>
          <li>Attendez la validation par le staff</li>
        </ol>
      </div>

      <div style={{ 
        background: "rgba(59, 130, 246, 0.2)", 
        borderRadius: "16px", 
        padding: "20px",
        border: "1px solid rgba(59, 130, 246, 0.4)"
      }}>
        <p style={{ color: "#93c5fd", fontSize: "15px" }}>
          🏪 Demandez le QR Code à votre serveur pour proposer vos chansons préférées !
        </p>
      </div>

    </main>
  );
}
