# PlayMySong

**PlayMySong** est une application musicale interactive destinée aux établissements (snack-bars, bars, lounges, restaurants, hôtels, boîtes soft).  
Elle permet aux clients de proposer des chansons via un **QR Code**, au personnel d’**administrer** et de valider les propositions, et à un **écran géant** (application Electron dédiée) d’afficher la musique en cours avec visuels (selfie/avatar, message, animations).

**But du README** : document de référence centralisé et vivant. Il doit être consulté et mis à jour avant toute décision de développement.

## Fonctionnalités Principales

### Côté Client
- **Accès par QR Code** vers une web app PWA (mobile-first).
- **Recherche** par titre, artiste, album, genre.
- **Proposition** d’une chanson (YouTube ou playlist interne).
- **Options facultatives** : selfie, avatar animé, message/dédicace.
- **Affichage** : confirmation, position approximative dans la file, temps d’attente estimé.

### Côté Administrateur (Compte établissement)
- **Compte par établissement** (login + mot de passe).
- **Dashboard** en temps réel : chansons en attente, playlist à venir, chanson en cours.
- Actions rapides : **valider**, **refuser** (avec motif), **retarder**, **passer**, **supprimer**.
- **Paramètres** : filtres automatiques (explicite, genres), mode auto, gestion multi-écrans, gestion playlists internes.
- **Gestion multi-établissements** pour propriétaires (compte multi-sites).

### Écran Géant
- **Application Electron dédiée** pilotée par le dashboard admin via WebSocket.
- Affichage dynamique : titre, artiste, selfie/avatar, message.
- Animations synchronisées avec la musique, thèmes visuels personnalisables.

### Business & Sécurité
- **Sponsoring** et affichage de logos discrets.
- **Statistiques** : chansons demandées, heures de pointe, genres.
- **Consentement** et modération des selfies (floutage, validation).
- **Protection des données** et mentions légales sur droit à l’image.

## Stack Technique Validée

### Frontend
- **React.js** (PWA mobile-first)
- **TailwindCSS**
- **Gestion d'état** : Redux Toolkit ou Zustand
- **Charting** : Chart.js pour statistiques

### Backend
- **Node.js** + **Express.js**
- **WebSocket** (Socket.IO) pour synchronisation temps réel
- **Authentification** : JWT pour sessions admin
- **ORM** : Prisma

### Base de données
- **PostgreSQL** (production) ; migrations et seeds gérées via Prisma

### Source musicale
- **YouTube Data API** pour catalogue externe (option gratuite)
- **Playlist interne** (fichiers audio hébergés ou liens YouTube privés)

### Écran Géant
- **Electron.js** pour application desktop dédiée
- **Animations** : GSAP ou Three.js selon complexité visuelle

### Déploiement
- **Local** : Docker + docker-compose (backend + db + services)
- **Production** : Backend sur Render/Heroku/Railway ; Frontend sur Vercel/Netlify ; DB sur Supabase/Postgres Cloud
- **CI/CD** : GitHub Actions

## Architecture Globale
- **Client Web App** (PWA) : propose des chansons, selfies, messages.
- **Admin Dashboard** : gestion des validations, contrôle des écrans.
- **Backend API** : logique playlist, règles de validation, auth.
- **WebSocket** : notifications temps réel, synchronisation écran.
- **Electron App** : affichage immersif piloté par admin.
- **DB** : stockage établissements, comptes, demandes, playlist, logs, stats.

## Arborescence proposée

project-root/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── ClientHome.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── SubmitSong.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── store/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── youtubeService.js
│   │   ├── utils/
│   │   └── styles/
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
│   ├── README.md          # ce fichier maître
│   ├── architecture.md
│   └── roadmap.md
│
├── .env.example
└── README.md              # lien vers docs/README.md


---

### Déploiement et Environnement

```markdown
## Variables d'environnement essentielles (.env)
- DATABASE_URL=postgresql://user:pass@localhost:5432/playmysong
- JWT_SECRET=changeme
- YOUTUBE_API_KEY=YOUR_YOUTUBE_KEY
- NODE_ENV=development
- ELECTRON_ENV=development

## Local Development
- Utiliser **docker-compose** pour lancer PostgreSQL et backend.
- Frontend en mode dev (npm run dev).
- Electron en mode dev connecté au backend local via WebSocket.

## Passage en production
- Migrer la DB vers un service cloud (Supabase ou managed Postgres).
- Déployer backend sur Render/Heroku/Railway.
- Déployer frontend sur Vercel/Netlify (PWA).
- Packager l’application Electron pour Windows/macOS/Linux.
- Mettre en place CI/CD (GitHub Actions) et sauvegardes DB régulières.

## Scrum
- **Sprints** : 2 semaines
- **Ceremonies** : Sprint Planning, Daily Scrum, Sprint Review, Retrospective
- **Backlog** : prioriser MVP puis itérations (selfies, filtres, sponsoring, multi-sites)
- **Definition of Done** : tests unitaires, tests d’intégration, documentation mise à jour, déploiement local OK

## Roadmap Sprints
- **Sprint 1 (MVP)** : Auth établissement, QR Code → Client PWA → recherche YouTube → proposer chanson → backend file d’attente → admin dashboard validation → Electron affiche chanson en cours.
- **Sprint 2** : Selfies/avatars, messages/dédicaces, modération basique.
- **Sprint 3** : Filtres automatiques, mode validation automatique, gestion playlists internes.
- **Sprint 4** : Animations synchronisées, thèmes visuels, multi-écrans.
- **Sprint 5** : Sponsoring, statistiques détaillées, export de rapports.
- **Sprint 6** : Multi-établissements avancé, sécurité et conformité renforcées.

## Prochaines étapes
1. Initialiser le dépôt Git et ajouter ce README dans docs/README.md.
2. Créer .env.example et config Docker de base.
3. Implémenter le modèle de données Prisma (establishments, users, songs, queue, logs).
4. Développer l’API d’authentification et le endpoint de proposition de chanson.
5. Construire la page client minimale (recherche YouTube + proposer).
6. Construire le dashboard admin minimal (liste en attente + valider/refuser).
7. Lancer tests locaux via docker-compose.

