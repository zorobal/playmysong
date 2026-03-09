import { Link } from "react-router-dom";

export default function ScanLanding({ establishment }) {
  const name = establishment?.name || "Établissement";
  return (
    <main style={{ padding: 20 }}>
      <h1>PlayMySong</h1>
      <h2>Bienvenue chez {name}</h2>
      <p>Proposez une chanson en quelques secondes.</p>
      <div style={{ marginTop: 20 }}>
        <Link to={`/request?establishmentId=${establishment?.id || ""}`}>
          <button style={{ width: "100%", padding: "20px", fontSize: "1.2rem", background: "#e94560", color: "white", border: "none", borderRadius: "10px" }}>
            🎵 Proposer une chanson
          </button>
        </Link>
      </div>
    </main>
  );
}
