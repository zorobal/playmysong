# Architecture PlayMySong

## Vue d'ensemble

PlayMySong est une application web permettant aux clients d'établissements (bars, lounges, etc.) de proposer des chansons via QR Code, avec validation en temps réel par les administrateurs.

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | Node.js + Express + Socket.IO |
| Base de données | PostgreSQL + Prisma ORM |
| Application Desktop | Electron + GSAP |
| PWA | Service Worker + Manifest |
| Gestion d'état | Zustand |

## Architecture des données

### Modèles Prisma

```
User (id, email, password, role, name, phoneNumber, establishmentId)
  - Rôle: SUPER_ADMIN, ADMIN, OPERATOR, USER

Establishment (id, name, city, district, phoneNumber, type, isActive)
  - Relations: playlists[], users[], songRequests[]

Playlist (id, establishmentId, name, createdBy)
  - Relations: songs[]

Song (id, playlistId, title, artist, filePath, youtubeId, duration)

SongRequest (id, establishmentId, youtubeId, title, artist, durationSec, 
            message, selfieUrl, filePath, position, status, rejectionReason)
  - Status: PENDING, VALIDATED, REJECTED, PLAYING, COMPLETED

PlaylistItem (id, songRequestId, order)

Invite (id, token, email, establishmentId, role, used, expiresAt)
```

## Architecture Backend

### Structure des routes

```
/auth          - Authentification (login, register)
/youtube       - Recherche YouTube Data API
/request       - Demandes de chansons (CRUD)
/playlists     - Gestion des playlists
/establishments - Gestion des établissements
/admins       - Gestion des administrateurs
/users        - Gestion des utilisateurs
/stats        - Statistiques globales
```

### WebSocket (Socket.IO)

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `join_establishment` | Client → Server | Rejoindre room par établissement |
| `new_request` | Server → Client | Nouvelle demande de chanson |
| `request_validated` | Server → Client | Demande validée |
| `request_rejected` | Server → Client | Demande rejetée |
| `now_playing_updated` | Server → Tous | Mise à jour chanson en cours |
| `playlist_updated` | Server → Client | Playlist mise à jour |

## Architecture Frontend

### Routes SPA

```
/                    - Login
/login               - Login
/client              - Page d'accueil client
/scan                - Page post-QR scan
/request             - Soumettre une demande
/search              - Recherche YouTube
/playlist            - Playlist de l'établissement
/dashboard/superadmin - Dashboard Super Admin
/dashboard/admin     - Dashboard Admin
/dashboard/operator  - Dashboard Opérateur
/dashboard/user      - Dashboard Utilisateur
```

### Stores Zustand

- `useAuthStore` - Gestion authentification (user, token, login, logout)
- `useEstablishmentStore` - Établissement courant
- `usePlaylistStore` - Gestion des demandes et playlist (requests, nowPlaying, playlist)

## Application Électron

### Structure

```
electron-app/
  main.js          - Processus principal (fenêtre, IPC, Socket.IO)
  preload.js       - Bridge sécurisé main ↔ renderer
  renderer/        - UI d'affichage (HTML + GSAP)
```

### Fonctionnalités

- Affichage plein écran (1920x1080)
- Connexion Socket.IO temps réel
- Animations GSAP (entrée chanson, file d'attente)
- Lecture audio fichiers locaux/uploadés

## PWA

### Configuration

- `manifest.json` - Métadonnées, icônes, thème
- `service-worker.js` - Cache offline

## Sécurité

- JWT pour authentification
- Password hashing (bcryptjs)
- CORS configuré
- Cookies sécurisés

## Déploiement

### Commandes de développement

```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev

# Electron
cd electron-app && npm start
```

### Production

- Build frontend: `npm run build` (Vite)
- Package Electron: `electron-builder`
