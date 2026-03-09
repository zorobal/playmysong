import { useState } from "react";
import CameraCapture from "./CameraCapture.jsx";
import { submitRequest } from "../services/api.js";

export default function SongFooterBar({ selected, establishmentId }) {
  const [message, setMessage] = useState("");
  const [selfieFile, setSelfieFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (!selected) return setStatus("Sélectionnez une chanson.");
    if (!consent) return setStatus("Veuillez accepter le droit à l'image.");
    setStatus("Envoi...");
    try {
      await submitRequest({
        establishmentId,
        songId: selected.id,
        title: selected.title,
        artist: selected.artist,
        message,
        selfie: selfieFile,
        consent: true
      });
      setStatus("Envoyé — en attente de validation");
      setMessage("");
      setSelfieFile(null);
    } catch (err) {
      setStatus("Erreur lors de l'envoi");
    }
  }

  return (
    <footer style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid #ddd", padding: 12 }}>
      {selected ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{selected.title}</div>
            <div style={{ fontSize: 13, color: "#666" }}>{selected.artist}</div>
            <div style={{ marginTop: 8 }}>
              <input placeholder="Message / dédicace (optionnel)" value={message} onChange={e => setMessage(e.target.value)} style={{ width: "100%", padding: 6 }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                J'accepte que ma photo soit affichée
              </label>
            </div>
          </div>

          <div style={{ width: 160 }}>
            <CameraCapture onCapture={file => setSelfieFile(file)} />
            <div style={{ marginTop: 8 }}>
              <button onClick={onSubmit} style={{ width: "100%", padding: "8px 12px" }}>Soumettre</button>
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>{status}</div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>Sélectionnez une chanson pour voir les options</div>
      )}
    </footer>
  );
}
