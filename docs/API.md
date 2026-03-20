```markdown
# PlayMySong API Documentation

Cette API permet de gérer l’authentification, les requêtes de chansons et les playlists pour l’application PlayMySong.  
Base URL : `http://localhost:4000`

---

## Auth

### POST /auth/login
Permet à un utilisateur de se connecter et de recevoir un token JWT.

**Body**
```json
{
  "email": "admin@playmysong.local",
  "password": "changeme"
}
```

**Response**
```json
{
  "token": "jwt_token_here",
  "establishmentId": 1
}
```

---

## YouTube

### GET /youtube/search
Recherche de vidéos sur YouTube.

**Query Params**
- `q` : terme de recherche (obligatoire)
- `limit` : nombre de résultats (optionnel, défaut = 10)

**Exemple**
```
GET {{baseUrl}}/youtube/search?q=Michael+Jackson&limit=5
```

**Response**
```json
[
  {
    "youtubeId": "abc123",
    "title": "Billie Jean",
    "channelTitle": "MichaelJacksonVEVO",
    "thumbnail": "https://..."
  }
]
```

---

## Requests

### POST /request
Créer une requête de chanson.

**Body**
```json
{
  "establishmentId": "1",
  "youtubeId": "abc123",
  "title": "Billie Jean",
  "artist": "Michael Jackson",
  "durationSec": 240,
  "message": "Play this classic!"
}
```

**Response**
```json
{
  "id": "req_123",
  "status": "pending"
}
```

---

### GET /request/pending
Liste des requêtes en attente (protégé par JWT).

**Headers**
```
Authorization: Bearer {{token}}
```

**Response**
```json
[
  {
    "id": "req_123",
    "title": "Billie Jean",
    "artist": "Michael Jackson",
    "status": "pending"
  }
]
```

---

### POST /request/{REQUEST_ID}/validate
Valide une requête (protégé par JWT).

**Headers**
```
Authorization: Bearer {{token}}
```

**Response**
```json
{
  "id": "req_123",
  "status": "validated"
}
```

---

## Playlists

### POST /playlist
Créer une playlist.

**Headers**
```
Authorization: Bearer {{token}}
```

**Body**
```json
{
  "name": "Party Mix",
  "description": "Best hits"
}
```

**Response**
```json
{
  "id": "pl_123",
  "name": "Party Mix",
  "description": "Best hits"
}
```

---

### GET /playlist
Lister les playlists (protégé par JWT).

**Headers**
```
Authorization: Bearer {{token}}
```

**Response**
```json
[
  {
    "id": "pl_123",
    "name": "Party Mix",
    "description": "Best hits"
  }
]
```

---

### POST /playlist/{PLAYLIST_ID}/add-song
Ajouter une chanson validée à une playlist.

**Headers**
```
Authorization: Bearer {{token}}
```

**Body**
```json
{
  "songRequestId": "{{REQUEST_ID}}"
}
```

**Response**
```json
{
  "playlistId": "pl_123",
  "songRequestId": "req_123",
  "status": "added"
}
```

---

### DELETE /playlist/{PLAYLIST_ID}
Supprimer une playlist.

**Headers**
```
Authorization: Bearer {{token}}
```

**Response**
```json
{
  "playlistId": "pl_123",
  "status": "deleted"
}
```

---

## Notes
- Toutes les routes protégées nécessitent un header :
  ```
  Authorization: Bearer {{token}}
  ```
- Les IDs (`REQUEST_ID`, `PLAYLIST_ID`) sont obtenus via les réponses des routes correspondantes.
- Les erreurs sont renvoyées sous forme JSON :
  ```json
  { "error": "Message d'erreur" }
  ```

```

---

## ✅ Résultat attendu
- Tu as un fichier `docs/API.md` clair et complet.  
- Chaque route est documentée avec **URL, paramètres, body, headers, exemples de réponse**.  
- Tu peux le partager avec ton équipe ou l’utiliser comme référence pour le frontend.

---

⚡️ En résumé : tu places ce fichier dans `D:\PlayMySong\docs\API.md`, et tu as une documentation prête à l’emploi pour ton backend.  

👉 Veux-tu que je t’aide à générer aussi une **version en anglais** de cette documentation, pour que tu puisses la partager avec des collaborateurs internationaux ?