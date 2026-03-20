# PlayMySong - État des lieux

## Ce qui est fait ✅

### Backend
- Serveur Express + Socket.IO
- Authentification JWT
- Routes REST complètes:
  - `/auth` - Login/Register
  - `/youtube` - Recherche YouTube
  - `/request` - Demandes de chansons (CRUD)
  - `/playlists` - Gestion playlists
  - `/establishments` - Gestion établissements
  - `/admins` - Gestion admins
  - `/users` - Gestion utilisateurs
  - `/stats` - Statistiques
- Base de données PostgreSQL + Prisma
- Upload de fichiers (selfies, musique)
- Génération QR Code automatique lors création établissement

### Frontend (React + Vite)
- Pages existantes:
  - `/` et `/login` - Connexion
  - `/dashboard/superadmin` - Gestion établissements
  - `/dashboard/admin` - Gestion demandes
  - `/dashboard/operator` - Validation demandes
  - `/dashboard/user` - Espace utilisateur
  - `/client` - Page client (basique)
  - `/scan` - Page post-QR
  - `/search` - Recherche YouTube
  - `/playlist` - Playlist de l'établissement
  - `/request` - Soumettre une demande
- TailwindCSS configuré
- Store Zustand (useAuthStore, useEstablishmentStore, usePlaylistStore)
- PWA (manifest.json, service worker)

### Electron
- Application écran géant
- Connexion Socket.IO temps réel
- Animations GSAP
- Lecture audio fichiers locaux/uploadés
- Affichage: Now Playing + File d'attente + Selfie + Message

### Base de données (Prisma)
- Modèles: User, Establishment, Playlist, Song, SongRequest, PlaylistItem, Invite
- Rôles: SUPER_ADMIN, ADMIN, OPERATOR, USER
- Statuts demandes: PENDING, VALIDATED, REJECTED, PLAYING, COMPLETED

---

## Ce qu'il faut faire 🔧

### Phase 1 - Flux client complet (Priorité HAUTE) - ✅ TERMINÉ

1. **Nouvelle page Client ( `/client` )** - ✅ FAIT
   - Page avec onglets (Playlist | YouTube)
   - Afficher les chansons des playlists
   - Recherche YouTube
   - Selfie (optionnel) + Message (optionnel)
   - Bouton "Envoyer"

2. **Correction flux QR Code** - ✅ FAIT
   - QR Code pointe vers `/client?establishmentId=xxx`

3. **Routes publiques pour playlists** - ✅ FAIT
   - `/playlists/public?establishmentId=xxx`
   - `/playlists/:id/songs`

4. **Gestion des demandes** - ✅ FAIT
   - Admin/Operator ET User peuvent valider/rejeter
   - Routes backend mises à jour avec rôle USER
   - Boutons Valider/Rejeter disponibles

5. **Onglet "Demandes" avec statistiques** - ✅ FAIT
   - Total demandes
   - Demandes en attente
   - Demandes validées
   - Demandes rejetées
   - Compteur en temps réel

6. **Envoi vers Electron** - ✅ EXISTS
   - Lors validation: selfie + message vers Electron
   - Affichage dans file d'attente

### Phase 2 - Publicités (Priorité MOYENNE - Pour plus tard)

1. **Base de données**
   - Nouveau modèle: Advertisement
   - Champs: imageUrl, videoUrl, type, duration, schedule, isActive

2. **Backend**
   - Routes API pour CRUD publicités
   - Route pour récupérer les publicités actives

3. **Admin Dashboard**
   - Interface pour ajouter/supprimer/publicités
   - Programmation affichage

4. **Electron**
   - Bloc publicitaire en bas de l'écran
   - Rotation images/vidéos
   - Indépendant de la lecture

---

## Questions en attente

1. QR Code → quelle URL?
2. Chanson playlist = validation requise?
3. Selfie + Message obligatoire ou optionnel?
4. Page unique ou onglets?

---

## Réponses aux questions (Phase 1)

### 1. QR Code
- Généré lors création établissement
- Affiché dans SuperAdmin Dashboard et Admin Dashboard
- Objectif: impression sur support papier
- URL: `/client?establishmentId=xxx`

### 2. Playlists vs Chansons validées
- Playlist: créée par Admin ou User pour un établissement
- Visible dans Admin Dashboard et User Dashboard
- Chansons validées: envoyées à Electron pour lecture
- Chansons en attente: pas encore validées, en attente de validation
- **Le client voit toutes les chansons des playlists pour en choisir une**

### 3. Validation
- **Toute chanson choisie** (playlist ou YouTube) **passe par validation**
- Après validation → ajoutée à la file d'attente

### 4. Selfie + Message
- **Optionnel** (pas obligatoire)
- Un seul selfie+message par demande de chanson

### 5. Page Client
- **Page unique avec onglets** (Playlist | YouTube)
- Section Playlist: liste des chansons disponibles
- Section YouTube: rechercher sur YouTube
- Selfie + Message: optionnels
- Bouton "Envoyer" pour soumettre

---

## Bugs connus

1. YouTube playback dans Electron nécessite yt-dlp
2. Pas de rate limiting
3. Dossier selfies peut être vide (403 si pas d'upload)
