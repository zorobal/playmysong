# PlayMySong - Historique des Modifications

Ce fichier documente l'évolution du projet PlayMySong.

---

## 2026-03-02 - Initialisation

### Contexte
- Analyse de la documentation existante (docs/README.md, docs/README2.md, docs/API.md)
- État des docs: architecture.md et roadmap.md vides

### Stack technique validée:
- Frontend: React PWA + TailwindCSS + Redux Toolkit/Zustand
- Backend: Node.js + Express + Socket.IO + Prisma
- DB: PostgreSQL
- Écran: Electron + GSAP/Three.js
- Source musicale: YouTube API + Playlist interne

---

## Structure des Agents du Projet

| Agent | Rôle | Spécialité |
|-------|------|------------|
| **ProjectLead** | Chef de projet | Coordination, décisionnel, architecture |
| **BackendDev** | Développeur Backend | Node.js, Express, Prisma, Socket.IO, PostgreSQL |
| **FrontendDev** | Développeur Frontend | React, PWA, TailwindCSS, UX/UI |
| **ElectronDev** | Développeur Desktop | Electron, animations, affichage dynamique |
| **DatabaseAdmin** | Administrateur BDD | PostgreSQL, migrations, seeds, performances |
| **QAEngineer** | QA & Tests | Tests unitaires, intégration, E2E |

---

## Détails des Agents

### 1. ProjectLead
- **Rôle**: Chef de projet
- **Responsabilités**:
  - Coordination générale du projet
  - Définition des priorités et jalons
  - Validation des décisions architecturales
  - Communication avec les parties prenantes
- **Outils**: Documentation, AGENTS.md, gestion de tâches

### 2. BackendDev
- **Rôle**: Développeur Backend
- **Responsabilités**:
  - Implémentation des API REST
  - Gestion des WebSockets (Socket.IO)
  - Authentification JWT
  - Intégration YouTube Data API
  - Services et contrôleurs
- **Technos**: Node.js, Express, Prisma, Socket.IO, PostgreSQL

### 3. FrontendDev
- **Rôle**: Développeur Frontend
- **Responsabilités**:
  - Application PWA mobile-first
  - Composants React (Client, Admin Dashboard)
  - Intégration API et WebSocket
  - Gestion d'état (Redux/Zustand)
  - UI/UX avec TailwindCSS
- **Technos**: React, Vite, TailwindCSS, Zustand, Chart.js

### 4. ElectronDev
- **Rôle**: Développeur Desktop
- **Responsabilités**:
  - Application Electron pour écran géant
  - Animations et effets visuels
  - Synchronisation temps réel avec backend
  - Personnalisation des thèmes
- **Technos**: Electron, GSAP, Three.js, Socket.IO

### 5. DatabaseAdmin
- **Rôle**: Administrateur Base de Données
- **Responsabilités**:
  - Schéma de données Prisma
  - Migrations et seeds
  - Optimisation des requêtes
  - Sauvegarde et restauration
- **Technos**: PostgreSQL, Prisma, SQL

### 6. QAEngineer
- **Rôle**: Ingénieur QA & Tests
- **Responsabilités**:
  - Tests unitaires (Jest/Vitest)
  - Tests d'intégration
  - Tests E2E (Playwright/Cypress)
  - Qualité et couverture de code
- **Technos**: Jest, Vitest, Playwright, Cypress

---

## Prochaines étapes
1. [x] Compléter architecture.md
2. [x] Compléter roadmap.md
3. [x] Définir l'état d'avancement du code existant
4. [x] Prioriser les tâches par agent
5. [x] Intégrer WebSocket (Socket.IO) dans server.js - FAIT
6. [ ] Corriger incohérence Prisma schema vs code (SongRequest/Request)
7. [ ] Développer le frontend client PWA

---

## 2026-03-02 - Intégration WebSocket

### Modifications effectuées:
- **backend/src/server.js**: Intégration de Socket.IO
  - Création du serveur HTTP avec `createServer()`
  - Configuration CORS pour le frontend
  - Gestion des connexions: `join_establishment`, `leave_establishment`
  - Événements: `request_song`, `admin_action`, `now_playing`
  - Broadcast aux rooms par établissement

### Événements WebSocket définis:
| Événement | Direction | Description |
|-----------|-----------|-------------|
| `join_establishment` | Client → Server | Rejoindre une room par établissement |
| `new_request` | Server → Client | Nouvelle demande de chanson |
| `request_validated` | Server → Admin/Client | Demande validée |
| `request_rejected` | Server → Admin/Client | Demande rejetée |
| `now_playing_updated` | Server → Tous | Mise à jour chanson en cours |

### Problème identifié:
- Incohérence entre le schéma Prisma (`Request`, `Playlist`) et le code (`songRequest`, `playlistItem`)
- À corriger par le DatabaseAdmin

---

## 2026-03-02 - Frontend Client PWA

### Modifications effectuées:
- **frontend/src/App.jsx**: Ajout des routes client PWA
  - `/` → ClientHome (redirect vers /scan si establishmentId)
  - `/scan` → ScanLanding (page post-QR)
  - `/search` → Recherche YouTube
  - `/playlist` → Playlist de l'établissement

- **frontend/src/pages/ClientHome.jsx**: Amélioration
  - Redirection automatique vers /scan si paramètre URL
  - UI améliorée avec boutons d'action
  - Design mobile-first

### État du Frontend Client:
| Page/Composant | Status |
|----------------|--------|
| ClientHome | ✅ Opérationnel |
| ScanLanding | ✅ Opérationnel |
| Search (YouTube) | ✅ Opérationnel |
| PlaylistView | ✅ Opérationnel |
| SongFooterBar | ✅ Opérationnel |
| CameraCapture | ✅ Existant |
| PlaylistItem | ✅ Existant |

### Prochaines étapes:
1. [x] Corriger incohérence Prisma schema vs code
2. [ ] Créer l'application Electron pour écran géant
3. [ ] Ajouter gestion d'état (Zustand/Redux)
4. [ ] Ajouter tests

---

## 2026-03-02 - Correction Schéma Prisma

### Modifications effectuées:
- **backend/prisma/schema.prisma**: Réécriture complète
  - Modèle `SongRequest` (au lieu de `Request`)
  - Modèle `PlaylistItem` (au lieu de `Playlist` + `Song` mix)
  - Modèle `Invite` pour invitations utilisateurs
  - Enum `RequestStatus` (PENDING, VALIDATED, REJECTED, PLAYING, COMPLETED)
  - Relations correctes entre modèles

- **backend/src/routes/Playlist.js**: Correction
  - `prisma.music` → `prisma.song`
  - `musics` → `songs`

### Modèles créés:
| Modèle | Description |
|--------|-------------|
| User | Utilisateurs (admin, operator, user) |
| Establishment | Établissements |
| Playlist | Playlists locales |
| Song | Chansons dans les playlists |
| SongRequest | Demandes de chansons (YouTube) |
| PlaylistItem | Items validés dans la playlist |
| Invite | Invitations utilisateurs |

### Commandes exécutées:
```bash
npx prisma generate
```

### Note:
⚠️ Une nouvelle migration sera nécessaire pour appliquer les changements en base de données

---

## 2026-03-02 - Application Électron (Écran Géant)

### Fichiers créés:

#### electron-app/package.json
- Configuration du projet Electron
- Dépendances: socket.io-client, electron

#### electron-app/main.js
- Fenêtre principale en plein écran (1920x1080)
- Connexion Socket.IO au backend
- Gestion des événements temps réel:
  - `new_request` - nouvelle demande
  - `request_validated` - demande validée
  - `request_rejected` - demande rejetée
  - `now_playing_updated` - chanson en cours
  - `playlist_updated` - playlist mise à jour
- IPC pour actions admin et mise à jour lecture

#### electron-app/preload.js
- Bridge sécurisé entre main et renderer
- Exposition des API Electron au renderer

#### electron-app/renderer/index.html
- UI d'affichage moderne et immersive
- Carte "Maintenant joué" avec titre, artiste, selfie, message
- File d'attente visible en bas
- Design gradient sombre avec accents rouge/néon
- Animations CSS (pulse, fade-in)
- Chargement automatique de la playlist

### Pour lancer l'application:
```bash
cd electron-app
npm install
npm start
# ou avec un établissement spécifique:
npm start -- --establishmentId=abc123
```

### Prochaines étapes:
1. [x] Corriger incohérence Prisma schema vs code
2. [x] Créer l'application Electron pour écran géant
3. [x] Finaliser le frontend Admin Dashboard
4. [ ] Ajouter gestion d'état (Zustand/Redux)
5. [ ] Ajouter tests
6. [ ] Configurer PWA pour le frontend

---

## 2026-03-02 - Admin Dashboard Finalisé

### Modifications effectuées:
- **frontend/src/pages/AdminDashboard.jsx**: Refonte complète
  - Gestion des demandes (valider/rejeter)
  - Socket.IO pour temps réel
  - 4 onglets: Demandes, Playlist, Utilisateurs, Statistiques
  - UI moderne avec gradient et cartes
  - Modal de rejet avec motif
  - Barre "Maintenant joué"
  - Statistiques en temps réel

- **frontend**: Installation de socket.io-client

- **backend/src/server.js**: Correction route duplicate

### Fonctionnalités ajoutées:
| Feature | Description |
|---------|-------------|
| Demandes | Validation/rejet en temps réel |
| Socket.IO | Mise à jour automatique |
| Playlist | Gestion CRUD complète |
| Utilisateurs | Ajout/suppression |
| Statistiques | Compters visuel |

### Prochaine étape: Ajouter gestion d'état (Zustand)

---

## 2026-03-02 - Précisions Rôles & SuperAdmin

### Modifications effectuées:

#### Backend:
- **prisma/schema.prisma**: Ajout champ `type` (Bar, Lounge, Snack-Bar, etc.) et `isActive`
- **src/services/qrcodeService.js**: Génération QR Code PNG
- **src/routes/Establishments.js**: 
  - Création avec type et QR code automatique
  - Modification/suppression établissements
  - Régénération QR code
  - Statistiques par établissement
- **src/routes/Stats.js**: Statistiques globales (nouveau)
- **src/routes/Requests.js**: Accès pour OPERATOR en plus de ADMIN
- **src/server.js**: Ajout route stats

#### Frontend:
- **src/pages/SuperAdminDashboard.jsx**: Refonte complète
  - Gestion établissements (CRUD)
  - Ajout admins par établissement
  - QR Code affiché (DataURL)
  - Activation/désactivation établissements
  - Statistiques globales
  - Types d'établissements (Bar, Lounge, etc.)
- **src/pages/OperatorDashboard.jsx**: Nouveau (dashboard simplifié)
  - Validation/rejet demandes
  - Temps réel via Socket.IO
  - Barre "Maintenant joué"
- **src/App.jsx**: Ajout route /dashboard/operator
- **src/pages/Login.jsx**: Redirection OPERATOR vers /dashboard/operator

### Définition des rôles:
| Rôle | Droits |
|------|--------|
| SUPER_ADMIN | Crée/gère tous les établissements et admins |
| ADMIN | Gère utilisateurs + valide/rejette chansons |
| OPERATOR | Valide/rejette chansons uniquement |
| USER (client) | Propose des chansons |

### Pour tester:
1. Backend doit être lancé (si arrêté: `npm run dev` depuis backend)
2. Frontend doit être lancé (si arrêté: `npm run dev` depuis frontend)
3. Créer un SuperAdmin manuellement dans la DB
4. Se connecter pour accéder au SuperAdmin Dashboard

---

## 2026-03-03 - Correction Prisma & Route Admin

### Problèmes rencontrés:

#### 1. Incohérence migration/schema Prisma
- Les anciennes migrations contenaient des tables obsolètes
- Erreur: "The column `colonne` does not exist"
- La DB était désynchronisée du schema Prisma

#### 2. Route create admins
- Utilisation de `$queryRaw` avec INSERT SQL brut
- Erreur 500 lors de la création d'admins

### Solutions appliquées:

#### 1. Reset complet des migrations
```bash
cd backend
rm -rf prisma/migrations
npx prisma migrate dev --name init
npx prisma generate
npm run seed
```

#### 2. Correction route POST /:id/admins
- Remplacement de `$queryRaw` par Prisma ORM
- Code corrigé dans `src/routes/Establishments.js`:
```javascript
const user = await prisma.user.create({
  data: {
    email: admin.email,
    password: hashedPassword,
    name: admin.name,
    phoneNumber: admin.phoneNumber,
    role: 'ADMIN',
    establishmentId: id,
    createdBy: 'SuperAdmin',
    isActive: true
  }
});
```

### Commandes pour relancer le projet:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Comptes de test:
| Rôle | Email | Mot de passe |
|------|-------|--------------|
| SUPER_ADMIN | SuperAdmin@playmysong.local | Vito |

---

## 2026-03-03 - Ajout de fichiers audio locaux

### Fonctionnalité implémentée:

#### Backend:
- **music-metadata**: Package installé pour extraire les métadonnées (titre, artiste, durée)
- **Route POST /playlists/:id/local-file**: 
  - Reçoit le chemin du fichier
  - Extrait les métadonnées automatiquement
  - Sauvegarde le chemin + métadonnées en base

#### Database (Prisma):
- Ajout des champs au modèle `Song`:
  - `filePath`: Chemin vers le fichier local
  - `duration`: Durée en secondes
  - `artist`: Optionnel (peut être null)

#### Frontend:
- **AdminDashboard.jsx**: Bouton 📁 pour ajouter un fichier local
- **UserDashboard.jsx**: Bouton 📁 Fichier local

#### Electron App:
- **main.js**: Handler IPC pour convertir chemin local en URL
- **preload.js**: Exposition de `getFileUrl`
- **renderer/index.html**: Lecture audio avec HTML5 Audio (supporte fichiers uploadés)

### Notes:
- L'upload de fichier fonctionne sur tous les navigateurs via FormData
- Les fichiers sont sauvegardés dans `backend/uploads/`
- Le backend sert les fichiers à `http://localhost:4000/uploads/[fichier]`
- L'Electron app lit les fichiers via l'URL HTTP
- Formats supportés: MP3, FLAC, WAV, OGG, M4A (selon music-metadata)

---

## 2026-03-03 - Configuration Frontend & Tests

### Contexte
- Analyse complète du projet en tant que ProjectLead
- Identification des problèmes critiques: CSS non importé, pas de TailwindCSS, store vide

### Modifications effectuées:

#### Frontend - TailwindCSS & Gestion d'état
- **frontend/tailwind.config.js**: Création config TailwindCSS
- **frontend/postcss.config.js**: Création config PostCSS
- **frontend/src/styles/index.css**: Ajout directives Tailwind (@tailwind base/components/utilities)
- **frontend/src/main.jsx**: Import des styles corrigé
- **frontend/src/store/index.js**: Création stores Zustand (useAuthStore, useEstablishmentStore, usePlaylistStore)
- Installation: `npm install zustand` + `npm install -D tailwindcss postcss autoprefixer`

#### PWA Configuration
- **frontend/public/manifest.json**: Création manifest PWA complet
- **frontend/public/sw.js**: Création service worker avec cache
- **frontend/index.html**: Ajout meta tags PWA, manifest, service worker registration

#### Électron - Animations GSAP
- **electron-app/renderer/index.html**: Ajout animations GSAP
  - `animateNewSong()`: Animation d'entrée pour nouvelle chanson (scale, rotation, opacity)
  - `animateQueueItem()`: Animation pour nouveaux éléments dans la file d'attente
- Installation: `npm install gsap` dans electron-app

#### Tests - Vitest
- **backend/vitest.config.js**: Configuration Vitest
- **backend/package.json**: Ajout scripts test, test:watch, test:coverage
- **backend/src/server.test.js**: Tests basiques (health check, auth)
- Installation: `npm install -D vitest @vitest/coverage-v8`

#### Documentation
- **docs/architecture.md**: Documentation complète de l'architecture
- **docs/roadmap.md**: Roadmap avec versions et tâches

### État actuel du projet

| Composant | Status |
|-----------|--------|
| Backend | ✅ Opérationnel |
| Frontend | ✅ TailwindCSS + Zustand |
| PWA | ✅ Configurée |
| Électron | ✅ Animations GSAP |
| Tests | ✅ Vitest configuré |
| Docs | ✅ Complètes |

### Commandes pour lancer le projet

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Électron (optionnel)
cd electron-app
npm install
npm start
```

### Commandes de test

```bash
# Backend tests
cd backend
npm run test
npm run test:coverage
```

---

## 2026-03-04 - Flux Client Complet

### Contexte
- Analyse des besoins avec le client
- Clarification du flux: QR Code → Page Client → Playlist/YouTube → Validation → Electron

### Modifications effectuées:

#### Frontend - Page Client
- **frontend/src/pages/ClientPage.jsx**: Nouvelle page client complète
  - Onglets: Playlist | YouTube
  - Liste des chansons depuis les playlists de l'établissement
  - Recherche YouTube intégrée
  - Selfie (optionnel) + Message (optionnel)
  - Envoi de la demande au backend
  - Design mobile-first avec TailwindCSS

#### QR Code
- **backend/src/services/qrcodeService.js**: URL modifiée vers `/client?establishmentId=xxx`
- **backend/src/server.js**: Ajout route static `/qrcodes`

#### Routes Playlist publiques
- **backend/src/routes/Playlist.js**: Ajout routes publiques
  - `GET /playlists/public?establishmentId=xxx` - Liste playlists sans auth
  - `GET /playlists/:id/songs` - Liste chansons sans auth

#### App.jsx
- **frontend/src/App.jsx**: Ajout route `/client` pour la nouvelle page

### Flux actuel

```
QR Code → /client?establishmentId=xxx
  ↓
Page Client (onglets Playlist | YouTube)
  ↓
Sélection chanson + Message optionnel + Selfie optionnel
  ↓
POST /request (avec upload selfie)
  ↓
Admin/Operator Dashboard → Valider/Rejeter
  ↓
Electron → Affichage file d'attente + Selfie + Message
```

### Fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| `frontend/src/pages/ClientPage.jsx` | Créé |
| `backend/src/services/qrcodeService.js` | Modifié |
| `backend/src/server.js` | Modifié |
| `backend/src/routes/Playlist.js` | Modifié |
| `frontend/src/App.jsx` | Modifié |
| `avoir.md` | Créé |
