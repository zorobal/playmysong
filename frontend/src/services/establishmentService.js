// src/services/establishmentService.js

const API_URL = "http://localhost:4000/establishments";

// Récupérer la liste des établissements
export async function getEstablishments(token) {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Erreur lors de la récupération des établissements");
  return res.json();
}

// Créer un établissement
export async function createEstablishment(token, data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Erreur lors de la création de l'établissement");
  return res.json();
}

// Modifier un établissement
export async function updateEstablishment(token, id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour de l'établissement");
  return res.json();
}

// Supprimer un établissement
export async function deleteEstablishment(token, id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression de l'établissement");
  return res.json();
}

// Ajouter des administrateurs à un établissement
export async function addAdmins(token, establishmentId, admins) {
  const res = await fetch(`${API_URL}/${establishmentId}/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ admins })
  });
  if (!res.ok) throw new Error("Erreur lors de l'ajout des administrateurs");
  return res.json();
}
