# PlayMySong - Prochaines Étapes

## Analyse des Points à Améliorer

### 1. Tests et Validation

#### Immédiatement après déploiement
- [ ] **Vérifier le SuperAdmin Dashboard**
  - Les établissements s'affichent-ils correctement?
  - L'onglet "📢 Publicités" fonctionne-t-il?
  - La suppression de publicités fonctionne-t-elle?

- [ ] **Tester le flux complet**
  ```
  QR Code → Client PWA → Demande chanson → Admin validation → NowPlaying
  ```

### 2. Fonctionnalités Manquantes ou à Compléter

#### Advertisement Feature
- [ ] **Upload d'images pour les publicités**
  - Interface d'upload dans Admin Dashboard
  - Support drag & drop
  - Redimensionnement automatique

- [ ] **Rotation des publicités sur NowPlaying**
  - Configurer la durée d'affichage
  - Intégrer avec le player
  - Compteur de rotations

#### NowPlaying Display
- [ ] **Page NowPlaying complète**
  - Affichage du titre et artiste en cours
  - Badge "🎵 Demande" vs "🎼 Playlist"
  - Métadonnées: durée, album, thumbnail
  - Selfie et message du demandeur
  - File d'attente visible
  - Carousel publicités

- [ ] **Electron App (Écran Géant)**
  - Animation GSAP pour nouvelles chansons
  - Synchronisation avec le backend
  - Mode plein écran

#### Client PWA
- [ ] **Amélioration de l'expérience utilisateur**
  - Indicateur de statut (demande envoyée, en attente, validée)
  - Notifications quand la chanson est validée
  - Historique de ses demandes

- [ ] **QR Code Scanner**
  - Page `/pwa/` pour scanner le QR code
  - Reconnaissance automatique de l'établissement

### 3. Performance et Optimisation

- [ ] **Mise en cache**
  - Service Worker pour PWA offline
  - Cache des playlists

- [ ] **Optimisation des images**
  - Compression des thumbnails
  - Lazy loading

### 4. Sécurité

- [ ] **Validation des entrées**
  - Sanitization des messages
  - Limite de caractères

- [ ] **Rate Limiting**
  - Limiter les demandes par utilisateur
  - Prévenir les abus

### 5. Backend - Améliorations

- [x] **YouTube Integration** - Fonctionne déjà sur l'app, donc la clé API est configurée sur Vercel ✅
- [ ] **Récupération des métadonnées** - Durée, album, thumbnails via YouTube Data API

### 6. Application Électron

- [x] **Non nécessaire** - L'application web suffit, Electron n'est pas supporté sur Vercel
- [ ] Optionnel: Si un jour on veut une app desktop, utiliser Tauri ounw.js

### 6. Base de Données

- [ ] **Migrations**
  - Vérifier que les migrations sont appliquées sur Neon
  - Script de backup régulier

- [ ] **Seed Data**
  - Données de test pour chaque établissement
  - Playlists pré-remplies

### 7. Domaines Personnalisés

- [ ] **À configurer plus tard** - Pour l'instant utiliser les URLs par défaut
  - Frontend: playmysong-998d4.web.app
  - Backend: playmysong-mu.vercel.app

### 8. Documentation

- [ ] **README.md** pour le projet
- [ ] **Guide d'installation** local
- [ ] **Guide de déploiement** pour Firebase et Vercel
- [ ] **API Documentation**

---

## Priorités Recommandées

### Haute Priorité (À faire maintenant)
1. ✅ ~~Vérifier SuperAdmin Dashboard~~ - Fait
2. [ ] Tester le flux complet demande → validation → affichage
3. [ ] Compléter la page NowPlaying
4. [ ] Interface d'upload pour les publicités

### Moyenne Priorité (Soon)
1. [ ] Améliorer l'expérience Client PWA
2. [ ] Notifications pour le client
3. [ ] Electron App pour écran géant

### Basse Priorité (Later)
1. [ ] Documentation complète
2. [ ] Tests automatisés
3. [ ] Optimisations de performance

---

## Questions en Suspens

1. **YouTube API Key** - Est-elle configurée sur Vercel?
2. **Écran Géant** - L'application Electron est-elle encore nécessaire?
3. **Domaines personnalisés** - veut-on utiliser un domaine propre?

---

## Notes pour le Prochain Agent

- Le projet utilise React + Vite pour le frontend
- Backend Node.js + Express déployé sur Vercel
- Base de données PostgreSQL sur Neon.tech
- Pas de WebSocket (Vercel ne le supporte pas) - utiliser du polling ou des rafraîchissements manuels
- Le fichier `config.js` contient l'URL de l'API
