import { useState } from "react";
import { submitRequest } from "../services/api.js";

export default function SubmitSong() {
  const [youtubeId, setYoutubeId] = useState("");
  const [message, setMessage] = useState("");
  const [selfie, setSelfie] = useState(null);
  const [status, setStatus] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("Envoi...");
    try {
      await submitRequest({ youtubeId, message, selfie });
      setStatus("Envoyé — en attente de validation");
      setYoutubeId(""); setMessage(""); setSelfie(null);
    } catch (err) {
      setStatus("Erreur lors de l'envoi");
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h2>Proposer une chanson</h2>
      <form onSubmit={onSubmit}>
        <label>
          YouTube ID ou lien
          <input value={youtubeId} onChange={e => setYoutubeId(e.target.value)} />
        </label>
        <label>
          Message / dédicace (optionnel)
          <input value={message} onChange={e => setMessage(e.target.value)} />
        </label>
        <label>
          Selfie (optionnel)
          <input type="file" accept="image/*" onChange={e => setSelfie(e.target.files[0])} />
        </label>
        <button type="submit">Envoyer</button>
      </form>
      <p>{status}</p>
    </main>
  );
}
