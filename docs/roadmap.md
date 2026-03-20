# Roadmap PlayMySong

## Version 1.0.0 - MVP (Terminé)

### Backend
- [x] Serveur Express + Socket.IO
- [x] Authentification JWT
- [x] Routes REST complètes
- [x] Base de données PostgreSQL + Prisma
- [x] Intégration YouTube Data API
- [x] Upload de fichiers (selfies, musique)
- [x] Génération QR Code
- [x] WebSocket temps réel

### Frontend
- [x] Application React + Vite
- [x] Pages: Login, Admin, Operator, Client
- [x] Intégration Socket.IO client
- [x] PWA basique

### Électron
- [x] Application écran géant
- [x] UI avec animations CSS
- [x] Socket.IO sync temps réel
- [x] Lecture audio fichiers locaux

---

## Version 1.1.0 - Améliorations UI (En cours)

### Frontend
- [x] TailwindCSS installé et configuré
- [x] Store Zustand créé
- [x] PWA complète (manifest, service worker)
- [ ] Refonte UI avec TailwindCSS
- [ ] Animations React (framer-motion)

### Électron
- [x] Animations GSAP ajoutées
- [ ] Thèmes personnalisables
- [ ] Intégration Three.js (fond visuel)

---

## Version 1.2.0 - Tests & Qualité

### Tests
- [x] Vitest configuré
- [ ] Tests unitaires (routes, services)
- [ ] Tests d'intégration API
- [ ] Couverture de code > 70%

### CI/CD
- [ ] GitHub Actions pour tests
- [ ] Linting (ESLint)
- [ ] Prettier

---

## Version 1.3.0 - Fonctionnalités avancées

### Backend
- [ ] Cache Redis pour performances
- [ ] Upload YouTube (yt-dlp)
- [ ] Analytics avancées
- [ ] API GraphQL (optionnel)

### Frontend
- [ ] Mode hors-ligne complet
- [ ] Notifications push
- [ ] Dark/Light mode
- [ ] Multi-langue (i18n)

### Électron
- [ ] Mode Karaoké (paroles)
- [ ] Playlist collaborative
- [ ] Sons/ambiance établissement

---

## Version 2.0.0 - Production

### Déploiement
- [ ] Docker Compose (dev)
- [ ] Kubernetes (prod)
- [ ] PostgreSQL managé (Supabase/Neon)
- [ ] Hébergement (Vercel/Railway/Render)

### Métriques
- [ ] Monitoring (Sentry)
- [ ] Analytics utilisateurs
- [ ] Dashboard stats avancé

---

## Bugs Connus

1. YouTube playback dans Electron nécessite yt-dlp
2. QR Code generation lente pour grands volumes
3. Pas de rate limiting sur les requêtes API
