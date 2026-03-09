// Utilise le proxy Vite pour rediriger vers http://localhost:4000
export async function getPlaylist(establishmentId) {
  const res = await fetch(`/establishments/${establishmentId}/playlist`);
  if (!res.ok) throw new Error("Failed to fetch playlist");
  return res.json();
}

export async function fetchPending(establishmentId) {
  const res = await fetch(`/request/pending?establishmentId=${establishmentId}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function submitRequest(payload) {
  const form = new FormData();
  if (payload.establishmentId) form.append("establishmentId", payload.establishmentId);
  if (payload.songId) form.append("songId", payload.songId);
  if (payload.youtubeId) form.append("youtubeId", payload.youtubeId);
  if (payload.title) form.append("title", payload.title);
  if (payload.artist) form.append("artist", payload.artist);
  if (payload.message) form.append("message", payload.message);
  if (payload.selfie) form.append("selfie", payload.selfie);
  form.append("consent", payload.consent ? "true" : "false");

  const res = await fetch("/request", {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "submit failed");
  }
  return res.json();
}
