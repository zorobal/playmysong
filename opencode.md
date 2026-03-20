# PlayMySong - Documentation du Projet

## Description
Application musicale pour établissements (bars, restaurants, hôtels) où les clients peuvent scanner un QR code pour demander des chansons depuis YouTube ou des playlists locales.

## Rôles Utilisateurs
- **SUPER_ADMIN** : Gère tous les établissements et administrateurs
- **ADMIN** : Gère les utilisateurs, playlists et demandes de l'établissement
- **OPERATOR** : Valide/rejette les demandes de chansons
- **USER** : Gère les playlists

---

## État Actuel du Projet

### ✅ Completed Features

1. **Système d'authentification**
   - Connexion avec email/mot de passe
   - JWT tokens
   - Gestion des rôles

2. **Dashboard SuperAdmin**
   - Liste des établissements
   - Création d'établissements
   - Ajout d'admins par établissement
   - Affichage du créateur (createdBy)

3. **Dashboard Admin**
   - Gestion des demandes de chansons (validation/rejet)
   - Gestion des playlists et chansons
   - Gestion des utilisateurs
   - Statistiques

4. **Dashboard Operator**
   - Validation/rejet des demandes

5. **Dashboard User**
   - Gestion des playlists
   - Ajout de chansons

6. **Page Client**
   - Scan QR code
   - Recherche YouTube
   - Demande de chansons

7. **Suivi du Créateur (createdBy)**
   - Tables User et Playlist ont maintenant un champ `createdBy`
   - Affiché dans tous les dashboards

### 🔧 Configuration Technique

**Backend (D:/PlayMySong/backend)**
- Express.js + Socket.io
- Prisma (avec requêtes SQL brutes)
- PostgreSQL

**Frontend (D:/PlayMySong/frontend)**
- React + Vite
- React Router
- Socket.io Client

**Ports**
- Backend: 4000
- Frontend: 5173

---

## Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| SUPER_ADMIN | SuperAdmin@playmysong.local | Vito |

---

## Problèmes Connus / Points à Vérifier

1. Les créations et affichages doivent être testés après chaque modification
2. Les erreurs sont parfois masquées - vérifier la console et les réponses API

---

## Commandes Utiles

```bash
# Lancer backend
cd D:/PlayMySong/backend
npm run dev

# Lancer frontend
cd D:/PlayMySong/frontend
npm run dev

# Recréer SuperAdmin
cd D:/PlayMySong/backend
npm run seed

# Arrêter processus sur port
taskkill //PID <PID> //F
```

---

## Fichiers Principaux

### Backend
- `src/server.js` - Point d'entrée
- `src/routes/Users.js` - Gestion utilisateurs
- `src/routes/Playlist.js` - Gestion playlists
- `src/routes/Establishments.js` - Gestion établissements
- `src/routes/Admins.js` - Routes admin
- `src/routes/Requests.js` - Demandes chansons

### Frontend
- `src/App.jsx` - Routing
- `src/pages/Login.jsx` - Page connexion
- `src/pages/SuperAdminDashboard.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/OperatorDashboard.jsx`
- `src/pages/UserDashboard.jsx`
- `src/pages/ClientHome.jsx`

---

## Prochaines Étapes Possibles

1. Tester la création complète (établissement → admin → utilisateur → playlist)
2. Améliorer le design
3. Ajouter更多 fonctionnalités QR code
4. Implémenter lecture YouTube
