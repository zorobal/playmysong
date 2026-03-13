import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function RedirectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Redirect directly to client page with establishmentId
      window.location.href = `/client?establishmentId=${id}`;
    } else {
      // No ID, go to home
      navigate("/clienthome");
    }
  }, [id, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
      color: "white",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🎵</div>
        <p>Chargement...</p>
      </div>
    </div>
  );
}
