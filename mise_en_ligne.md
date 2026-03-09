# Guide de Déploiement - PlayMySong

## Résumé du Projet

PlayMySong est une application de gestion de musique en établissement (bar, lounge, restaurant) permettant aux clients de proposer des chansons via QR Code.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │    Backend      │     │    Database     │
│  (Firebase)     │────▶│    (Vercel)     │────▶│   (Neon)        │
│  React PWA      │     │  Node.js/Express│     │  PostgreSQL     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Electron App   │
                        │ (Écran géant)   │
                        └─────────────────┘
```

---

## 1. Dépôt GitHub

### Création
- **URL**: https://github.com/zorobal/playmysong
- **Branche principale**: `main`
- **Méthode**: Créé via API GitHub avec Personal Access Token

### Commandes locales
```bash
git remote add origin https://github.com/zorobal/playmysong.git
git push -u origin main
```

---

## 2. Frontend - Firebase Hosting

### Service utilisé
- **Nom**: Firebase Hosting
- **URL**: https://playmysong-998d4.web.app/
- **Prix**: Gratuit (Forward slash et Firebase Spark)

### Déploiement
1. Installer Firebase CLI: `npm install -g firebase-tools`
2. Se connecter: `firebase login`
3. Initialiser: `firebase init hosting`
4. Déployer: `firebase deploy`

### Configuration
- Fichier: `frontend/.firebaserc`
- Fichier: `firebase.json`

---

## 3. Backend - Vercel

### Service utilisé
- **Nom**: Vercel
- **URL**: https://playmysong-backend.vercel.app
- **Prix**: Gratuit ( Hobby: 100GB bandwidth/mois)

### Configuration Vercel

#### Fichier `backend/vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

#### Fichier `backend/package.json`
```json
{
  "name": "playmysong-backend",
  "version": "1.0.0",
  "engines": {
    "node": "22.x"
  },
  "scripts": {
    "start": "node src/server.js",
    "install": "npm install && npx prisma generate"
  }
}
```

### Variables d'environnement (Vercel)

| Variable | Valeur |
|----------|--------|
| DATABASE_URL | `postgresql://neondb_owner:npg_1tel4HJCEKzb@ep-calm-tree-adqj4iad-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| JWT_SECRET | `playmysong-secret-2024` |
| JWT_REFRESH_SECRET | `playmysong-refresh-secret-2024` |
| FRONTEND_ORIGIN | `https://playmysong-998d4.web.app/` |
| NODE_ENV | `production` |
| PORT | `3000` |
| YOUTUBE_API_KEY | `AIzaSyA9gmeXiTupgxQFEseK1xFVaiXCY3kusnM` |

### Étapes de déploiement sur Vercel

1. Aller sur https://vercel.com
2. Se connecter avec GitHub
3. Cliquer "Add New..." → "Project"
4. Sélectionner `zorobal/playmysong`
5. Choisir le Root Directory: `backend`
6. Framework Preset: `Other`
7. Cliquer "Deploy"
8. Après déploiement, aller dans Settings → Environment Variables
9. Ajouter les variables ci-dessus

---

## 4. Base de données - Neon

### Service utilisé
- **Nom**: Neon (Neon.tech)
- **Type**: PostgreSQL serverless
- **Prix**: Gratuit (0.5GB stockage, 1 compute)

### Configuration
- **Projet**: bitter-bonus-47713690
- **Branch**: main
- **URL de connexion**: Pooled connection string

### Connection String
```
postgresql://neondb_owner:npg_1tel4HJCEKzb@ep-calm-tree-adqj4iad-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 5. Autres services testés (non utilisés)

### Render
- Problème: Site inaccessible depuis la France

### Cyclic
- Problème: DNS non résolu (site down)

### Glitch
- Problème: Redirige vers blog.glitch.com

### Fly.io
- Nécessite installation locale de `flyctl`
- Non testé faute de temps

---

## 6. Fichiers de configuration créés

| Fichier | Description |
|---------|-------------|
| `backend/vercel.json` | Configuration Vercel |
| `backend/render.yaml` | Configuration Render (non utilisé) |
| `backend/railway.json` | Configuration Railway (non utilisé) |
| `backend/Dockerfile` | Pour déploiement Docker |
| `backend/cyclic.json` | Configuration Cyclic (non utilisé) |
| `backend/fly.toml` | Configuration Fly.io (non utilisé) |
| `backend/glitch.json` | Configuration Glitch (non utilisé) |
| `backend/.env` | Variables d'environnement production |

---

## 7. Commandes pour mettre à jour

### Après modification du code

```bash
# Frontend
cd frontend
firebase deploy

# Backend (déclenché automatiquement via GitHub)
git add .
git commit -m "Description des changements"
git push origin main
```

### Sur Vercel
- Le déploiement est automatique après chaque push sur `main`
- Variables d'environnement: Settings → Environment Variables

---

## 8. Notes importantes

### Socket.IO
Vercel ne supporte pas bien Socket.IO pour le temps réel. Solutions:
- Utiliser un service tiers (Pusher, Ably)
- Héberger le backend sur un autre service (Railway, Render)

### Limites gratuites
- **Vercel**: 100GB/mois bandwidth
- **Neon**: 0.5GB stockage, 1 compute branch
- **Firebase**: 1GB stockage, 10GB transfert/mois

---

## 9. Comptes utilisés

| Service | Compte |
|---------|--------|
| GitHub | zorobal |
| Firebase | Compte Google |
| Vercel | GitHub OAuth |
| Neon | GitHub OAuth |
| YouTube API | Clé: `AIzaSyA9gmeXiTupgxQFEseK1xFVaiXCY3kusnM` |

---

## 10. URLs finales

| Service | URL |
|---------|-----|
| Frontend | https://playmysong-998d4.web.app/ |
| Backend API | https://playmysong-backend.vercel.app/ |
| GitHub | https://github.com/zorobal/playmysong |

---

*Document créé le 9 mars 2026*
