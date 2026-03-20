# PlayMySong

**PlayMySong** est une application musicale interactive destinée aux établissements (snack‑bars, bars, lounges, restaurants, hôtels, boîtes soft).  
Elle permet aux clients de proposer des chansons via un **QR Code**, au personnel d’**administrer** et de valider les propositions, et à un **écran géant** (application Electron dédiée) d’afficher la musique en cours avec visuels (selfie/avatar, message, animations).

> **But de ce README** : document de référence centralisé et vivant. Il doit être consulté et mis à jour avant toute décision de développement.

---

## Table des matières
- **Fonctionnalités principales**
- **Parcours client détaillé** (nouveau)
- **Recommandations UX et alternatives**
- **API minimale requise**
- **Payloads et stockage**
- **Composants frontend prioritaires**
- **Architecture et arborescence**
- **Déploiement et environnement**
- **Roadmap sprints**
- **Prochaines étapes**

---

## Fonctionnalités principales

### Côté client
- **Accès par QR Code** vers une web app PWA (mobile‑first).  
- **Recherche** par titre, artiste, album, genre.  
- **Proposition** d’une chanson (YouTube ou playlist interne).  
- **Options facultatives** : selfie, avatar animé, message/dédicace.  
- **Affichage** : confirmation, position approximative dans la file, temps d’attente estimé.

### Côté administrateur (compte établissement)
- **Compte par établissement** (login + mot de passe).  
- **Dashboard** en temps réel : chansons en attente, playlist à venir, chanson en cours.  
- Actions rapides : **valider**, **refuser** (avec motif), **retarder**, **passer**, **supprimer**.  
- **Paramètres** : filtres automatiques (explicite, genres), mode auto, gestion multi‑écrans, gestion playlists internes.  
- **Gestion multi‑établissements** pour propriétaires (compte multi‑sites).

### Écran géant
- **Application Electron** pilotée par le dashboard via WebSocket.  
- Affichage dynamique : titre, artiste, selfie/avatar, message.  
- Animations synchronisées avec la musique, thèmes visuels personnalisables.

### Business & sécurité
- **Sponsoring** et affichage de logos discrets.  
- **Statistiques** : chansons demandées, heures de pointe, genres.  
- **Consentement** et modération des selfies (floutage, validation).  
- **Protection des données** et mentions légales sur droit à l’image.

---

## Parcours client détaillé (nouvelle version — UX optimisée)

**Objectif** : rendre le parcours intuitif, rapide et sans saisie d’URL manuelle.

1. **Scan du QR**
   - Le QR code (affiché sur murs, tables, flyers) encode au minimum `establishmentId` et éventuellement `location`/`theme`.
   - Le client est dirigé vers une **page d’accueil personnalisée** affichant : nom de l’application, nom de l’établissement, bref message de bienvenue.

2. **Choix de la source**
   - **Playlist de l’établissement** (par défaut) → affiche la playlist locale.
   - **Rechercher sur YouTube** → recherche intégrée dans l’app (préférée) pour éviter toute saisie d’URL.

3. **Playlist locale**
   - Trois modes d’affichage / tri :
     - **Titre** : chansons triées par ordre alphabétique du titre.
     - **Artiste** : chansons triées par ordre alphabétique de l’artiste.
     - **Recherche en temps réel** : filtrage dynamique au fil de la saisie (autocomplete / instant filter).
   - L’utilisateur sélectionne une chanson ; la sélection active la **barre récapitulative** en bas de l’écran.

4. **Récapitulatif et options**
   - Affichage du **Titre** et de l’**Artiste** sélectionnés.
   - **Ajouter un selfie** : ouverture de la caméra (via `getUserMedia()` ou `<input capture>` sur mobile).
   - **Ajouter un message / dédicace** (champ texte).
   - **Consentement** : case à cocher pour accepter la publication de la photo (droit à l’image).
   - **Soumettre** : envoi au backend (FormData si selfie) → notification admin via WebSocket.

5. **Flux YouTube (recommandé : recherche intégrée)**
   - L’utilisateur effectue une recherche YouTube dans l’app ; les résultats affichent titre, chaîne, vignette.
   - À la sélection, l’app récupère automatiquement `youtubeId`, `title`, `artist` (si disponible) et `thumbnail` via le backend (proxy YouTube Data API).
   - Même écran récapitulatif (selfie/message/consentement) puis soumission.

6. **Traitement côté admin**
   - Les demandes arrivent dans la console admin (REST + WebSocket).
   - L’admin peut **valider**, **mettre en attente**, **rejeter** (avec motif).
   - Les actions déclenchent des événements WebSocket pour mettre à jour l’écran géant et le dashboard.

7. **Écran géant**
   - Affiche la chanson en cours, selfie/message si approuvés, et la file d’attente.
   - Animations et thèmes synchronisés selon la configuration de l’établissement.

---

## Recommandations UX et alternatives

- **Recherche intégrée YouTube** (via backend proxy) : meilleure UX et capture fiable des métadonnées.  
- **Ne pas rediriger vers youtube.com** pour choisir une chanson ; si redirection nécessaire, prévoir un mécanisme pour capturer métadonnées (moins fiable).  
- **Capture selfie** : `getUserMedia()` pour expérience native ; fallback `<input type="file" accept="image/*" capture="environment">`.  
- **Pré‑remplissage** : si le QR contient `establishmentId`, précharger playlist et thème visuel.  
- **Estimation d’attente** : calculer position approximative et afficher un temps estimé.  
- **Minimiser la saisie** : éviter les champs URL ; l’utilisateur choisit via recherche ou playlist.  
- **Consentement & RGPD** : case à cocher obligatoire avant envoi ; stocker preuve de consentement (timestamp, IP, version du texte).

---

## API minimale requise (endpoints)

**REST**
- `GET /establishments/:id/playlist`  
  - Retourne la playlist locale (id, title, artist, duration, thumbnail).  
  - Supporte `?sort=title|artist` et `?q=searchTerm` pour recherche côté serveur.

- `GET /youtube/search?q=...`  
  - Proxy backend vers YouTube Data API ; renvoie `youtubeId`, `title`, `channel`, `thumbnail`.

- `POST /request`  
  - Reçoit FormData : `establishmentId`, `songId` **ou** `youtubeId`, `message`, `selfie` (file), `consent`.  
  - Retourne `{ id, status: "pending" }` et émet `new_request` via WebSocket.

- `GET /request/pending?establishmentId=...`  
  - Liste des demandes en attente pour l’établissement.

- `POST /request/:id/validate`  
  - Valide une demande ; émet `request_updated`.

- `POST /request/:id/reject`  
  - Rejette une demande avec motif.

**WebSocket (Socket.IO ou équivalent)**
- `new_request` → notifie dashboard et écran géant.  
- `request_updated` → met à jour file d’attente et affichage.

---

## Payloads et stockage

**FormData (exemple)**
- `establishmentId`  
- `songId` (local) **ou** `youtubeId`  
- `title` (optionnel)  
- `artist` (optionnel)  
- `message` (optionnel)  
- `selfie` (file)  
- `consent` (boolean)

**Stockage des selfies**
- Stocker dans un objet storage (S3, Supabase Storage).  
- Sauvegarder l’URL dans la base de données.  
- Redimensionner / compresser côté backend avant stockage.  
- Option : modération automatique (vision API) + flag `needs_moderation`.

---

## Composants frontend prioritaires

**Pages**
- `ScanLanding.jsx` — page d’accueil après scan (nom app + établissement + choix source).  
- `ClientHome.jsx` — page d’accueil générale / fallback.  
- `Search.jsx` / `YouTubeSearch.jsx` — recherche intégrée YouTube.  
- `SubmitSong.jsx` / `PlaylistView.jsx` — affichage playlist locale, tri, recherche live.  
- `AdminDashboard.jsx` — liste pending + actions (valider/rejeter).

**Composants**
- `CameraCapture.jsx` — wrapper pour capture photo mobile.  
- `SongFooterBar.jsx` — récapitulatif en bas avec titre/artiste, selfie, message, bouton soumettre.  
- `PlaylistItem.jsx` — élément de liste de chanson.  
- `NotificationToast.jsx` — retours utilisateur (succès/erreur).

**Services**
- `services/api.js` — `getPlaylist`, `submitRequest`, `fetchPending`.  
- `services/youtubeService.js` — `searchYouTube` (via backend proxy).

---

## Architecture et arborescence proposée

```
project-root/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraCapture.jsx
│   │   │   ├── SongFooterBar.jsx
│   │   │   └── PlaylistItem.jsx
│   │   ├── pages/
│   │   │   ├── ScanLanding.jsx
│   │   │   ├── ClientHome.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── SubmitSong.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── youtubeService.js
│   │   ├── store/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── playlistService.js
│   │   │   └── youtubeService.js
│   │   ├── models/        # Prisma schema + types
│   │   ├── middleware/    # auth, rate-limit, moderation
│   │   └── utils/
│   ├── prisma/
│   └── package.json
│
├── database/
│   ├── migrations/
│   ├── seed/
│   └── schema.sql
│
├── electron-app/
│   ├── main.js
│   ├── renderer/
│   │   ├── src/
│   │   └── assets/
│   └── package.json
│
├── infra/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── docs/
│   ├── README.md          # ce fichier maître (copie / version longue)
│   ├── architecture.md
│   └── roadmap.md
│
├── .env.example
└── README.md              # lien vers docs/README.md
```

---

## Déploiement et environnement

**Variables d’environnement essentielles (.env)**
- `DATABASE_URL=postgresql://user:pass@localhost:5432/playmysong`  
- `JWT_SECRET=changeme`  
- `YOUTUBE_API_KEY=YOUR_YOUTUBE_KEY`  
- `NODE_ENV=development`  
- `ELECTRON_ENV=development`

**Local development**
- Utiliser **docker-compose** pour lancer PostgreSQL et backend.  
- Frontend en mode dev (`npm run dev` avec proxy Vite).  
- Electron en mode dev connecté au backend local via WebSocket.

**Production**
- Migrer la DB vers un service cloud (Supabase ou managed Postgres).  
- Déployer backend sur Render/Heroku/Railway.  
- Déployer frontend sur Vercel/Netlify (PWA).  
- Packager l’application Electron pour Windows/macOS/Linux.  
- Mettre en place CI/CD (GitHub Actions) et sauvegardes DB régulières.

---

## Roadmap sprints (exemple)

- **Sprint 1 (MVP)** : Auth établissement, QR Code → Client PWA → recherche YouTube → proposer chanson → backend file d’attente → admin dashboard validation → Electron affiche chanson en cours.  
- **Sprint 2** : Selfies/avatars, messages/dédicaces, modération basique.  
- **Sprint 3** : Filtres automatiques, mode validation automatique, gestion playlists internes.  
- **Sprint 4** : Animations synchronisées, thèmes visuels, multi‑écrans.  
- **Sprint 5** : Sponsoring, statistiques détaillées, export de rapports.  
- **Sprint 6** : Multi‑établissements avancé, sécurité et conformité renforcées.

---

## Tests et mise en place locale

- **Frontend** : `npm install` puis `npm run dev` (Vite). Utiliser proxy pour `/youtube` et `/request`.  
- **Backend** : lancer via Docker ou `npm run dev` local ; exposer endpoints listés.  
- **Mock / stubs** : prévoir stubs pour `GET /establishments/:id/playlist` et `GET /youtube/search` pour tester UI sans clé YouTube.  
- **Tests manuels** : scanner QR (ou ouvrir `/?establishmentId=123`), choisir chanson locale, ajouter selfie, soumettre, vérifier réception dans `AdminDashboard` (mock ou réel).

---

## Prochaines étapes (priorisées)

1. Remplacer le README actuel par cette version complète dans `docs/README.md` et ajouter un lien depuis la racine `README.md`.  
2. Implémenter les composants frontend prioritaires : `ScanLanding`, `PlaylistView`, `SongFooterBar`, `CameraCapture`.  
3. Adapter `services/api.js` et `youtubeService.js` (proxy backend).  
4. Mettre en place endpoints backend minimal et WebSocket (Socket.IO) pour `new_request` / `request_updated`.  
5. Tester bout à bout avec mock data, puis connecter au backend réel.  
6. Ajouter modération des selfies et stockage objet (S3 / Supabase Storage).

---

## Notes finales
- Ce README est **vivant** : mets‑le à jour à chaque décision d’architecture, changement d’API ou évolution UX.  
- L’objectif immédiat est d’obtenir un **parcours client fluide** sans saisie d’URL, une **capture selfie simple** et une **validation admin** réactive via WebSocket.  
- Si tu veux, je peux générer un **diff** prêt à coller pour remplacer l’actuel `docs/README.md`, ou directement fournir le fichier `README.md` finalisé à coller dans le dépôt. Dis‑moi ta préférence.