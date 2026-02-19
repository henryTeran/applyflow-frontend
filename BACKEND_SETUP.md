# Configuration Backend pour le Frontend

## ⚠️ CORS Configuration Requise

Le backend FastAPI doit autoriser les requêtes depuis le frontend. Ajoutez la configuration CORS dans votre backend.

### Dans le fichier principal du backend (main.py ou app.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server (port par défaut)
        "http://localhost:5174",  # Vite dev server (port alternatif)
        "http://localhost:3000",  # Au cas où
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Pour la production

```python
# Configurez avec votre domaine de production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://votre-domaine.com",
        "https://www.votre-domaine.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔧 Autres Configurations

### 1. Vérifier que le backend est lancé

```bash
cd ../backend  # Depuis le dossier frontend
# Lancez votre backend FastAPI
uvicorn main:app --reload --port 8000
```

### 2. Vérifier l'URL du backend

Dans le frontend, vérifiez `.env` ou `.env.local` :

```env
VITE_API_URL=http://localhost:8000
```

### 3. Tester une route backend

Ouvrez votre navigateur :
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/api/v1/health/live

## 📝 Autocomplete Attributes (Optionnel)

Pour supprimer les warnings du navigateur concernant l'autocomplete, vous pouvez ajouter les attributs suivants aux champs de formulaire :

### Dans LoginPage.tsx

```tsx
<Input
  id="email"
  type="email"
  autoComplete="email"
  placeholder="votre@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>

<Input
  id="password"
  type="password"
  autoComplete="current-password"
  placeholder="••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>
```

### Dans RegisterPage.tsx

```tsx
<Input
  id="email"
  type="email"
  autoComplete="email"
  // ...
/>

<Input
  id="password"
  type="password"
  autoComplete="new-password"
  // ...
/>
```

## 🎯 Checklist de démarrage

- [ ] Backend FastAPI lancé sur port 8000
- [ ] CORS configuré dans le backend
- [ ] Frontend lancé sur port 5173 ou 5174
- [ ] Variable d'environnement VITE_API_URL correcte
- [ ] Test de connexion : http://localhost:8000/docs

## 🔍 Debug

Si les requêtes échouent toujours :

1. Vérifiez les logs du backend
2. Ouvrez les DevTools → Network → Vérifiez les requêtes
3. Vérifiez que le backend répond bien sur les endpoints API
4. Essayez avec curl ou Postman pour tester l'API directement

```bash
# Test avec curl
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```
