# 🔄 Modifications Frontend Requises - Intégration Profil Utilisateur

**Date:** 5 décembre 2025  
**Objectif:** Le calcul de match utilise maintenant le profil utilisateur réel (CV) au lieu d'un profil par défaut

---

## ⚠️ CHANGEMENTS BACKEND

### Endpoint Modifié: `POST /api/v1/job-matches/analyze/{job_offer_id}`

**Avant:**
```python
# Utilisait un profil par défaut (DEFAULT_CANDIDATE)
POST /api/v1/job-matches/analyze/5
```

**Après:**
```python
# Utilise le profil de l'utilisateur connecté (via JWT + CV)
POST /api/v1/job-matches/analyze/5
Headers: Authorization: Bearer <token>

# Le backend:
# 1. Identifie l'utilisateur via le token JWT
# 2. Charge son CV (si uploadé)
# 3. Extrait son profil du CV
# 4. Calcule le match avec son vrai profil
```

---

## ✅ MODIFICATIONS FRONTEND NÉCESSAIRES

### 1. **S'assurer que l'authentification est bien envoyée**

Le endpoint `/analyze/{job_offer_id}` nécessite maintenant l'authentification.

#### ✅ Si déjà fait dans apiClient.ts:
```typescript
// Vérifier que le token est bien envoyé
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Aucun changement nécessaire si déjà configuré !**

---

### 2. **Encourager l'utilisateur à uploader son CV**

Le match sera plus précis si l'utilisateur a uploadé son CV.

#### Page Settings/Profile - Ajouter section CV:

```tsx
// src/pages/SettingsPage.tsx ou ProfilePage.tsx

const [cvFile, setCvFile] = useState<File | null>(null);
const [uploading, setUploading] = useState(false);

const handleUploadCV = async () => {
  if (!cvFile) return;
  
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('file', cvFile);
    
    await api.post('/users/upload-cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    toast.success('CV uploadé avec succès !');
  } catch (error) {
    toast.error('Erreur lors de l\'upload');
  } finally {
    setUploading(false);
  }
};

return (
  <Card>
    <CardHeader>
      <CardTitle>Mon CV</CardTitle>
      <CardDescription>
        Uploadez votre CV pour des recommandations plus précises
      </CardDescription>
    </CardHeader>
    <CardContent>
      {user.cv_path ? (
        <div className="flex items-center gap-2">
          <FileCheck className="text-green-500" />
          <span>CV uploadé</span>
          <Button variant="outline" size="sm">
            Remplacer
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Uploadez votre CV pour améliorer la précision des matchs
            </AlertDescription>
          </Alert>
          
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          />
          
          <Button
            onClick={handleUploadCV}
            disabled={!cvFile || uploading}
          >
            {uploading ? 'Upload...' : 'Uploader mon CV'}
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);
```

---

### 3. **Afficher un message si pas de CV**

Sur la page JobOfferDetail, avant l'analyse:

```tsx
// JobOfferDetailPage.tsx

const [user, setUser] = useState(null);

useEffect(() => {
  const fetchUser = async () => {
    const { data } = await api.get('/users/me');
    setUser(data);
  };
  fetchUser();
}, []);

const handleAnalyzeMatch = async () => {
  // Avertir si pas de CV
  if (!user.cv_path) {
    const confirm = window.confirm(
      'Vous n\'avez pas encore uploadé votre CV. ' +
      'Le match sera calculé avec un profil générique. ' +
      'Voulez-vous continuer ?'
    );
    if (!confirm) return;
  }
  
  try {
    const { data } = await api.post(`/job-matches/analyze/${jobOfferId}`);
    setMatch(data);
  } catch (error) {
    console.error(error);
  }
};
```

---

### 4. **Interface User mise à jour**

```typescript
// src/types/user.ts

export interface User {
  id: number;
  email: string;
  name: string;
  cv_path: string | null;  // ✨ Nouveau champ
  cover_letter_template: string | null;  // ✨ Nouveau champ
  created_at: string;
  updated_at: string;
}
```

---

## 🎨 UI/UX RECOMMANDÉES

### Badge "CV Uploadé"
```tsx
// Dans le header ou profil
{user.cv_path ? (
  <Badge variant="success">
    <FileCheck className="w-3 h-3 mr-1" />
    CV Uploadé
  </Badge>
) : (
  <Badge variant="warning">
    <AlertCircle className="w-3 h-3 mr-1" />
    Pas de CV
  </Badge>
)}
```

### Tooltip explicatif
```tsx
<Tooltip>
  <TooltipTrigger>
    <Info className="w-4 h-4" />
  </TooltipTrigger>
  <TooltipContent>
    <p>Le match est calculé selon votre profil.</p>
    <p className="text-xs text-muted-foreground">
      Uploadez votre CV pour améliorer la précision.
    </p>
  </TooltipContent>
</Tooltip>
```

---

## 📊 WORKFLOW UTILISATEUR OPTIMAL

```
1. Inscription / Login
   ↓
2. Redirection vers Settings → "Uploadez votre CV"
   ↓
3. Upload CV (PDF)
   ↓
4. Retour au Dashboard
   ↓
5. Ajouter offres d'emploi
   ↓
6. Analyser matchs → Utilise le CV uploadé automatiquement
```

---

## 🔄 COMPATIBILITÉ

### ✅ Pas de breaking changes
- L'endpoint existe toujours
- Même route: `POST /analyze/{job_offer_id}`
- Même réponse: `JobMatchRead`

### ⚡ Nouveautés
- Nécessite authentification (token JWT)
- Utilise le profil utilisateur réel
- Plus précis si CV uploadé

---

## 📝 CHECKLIST FRONTEND

- [ ] Vérifier que le token JWT est envoyé dans les headers
- [ ] Ajouter section "Upload CV" dans Settings/Profile
- [ ] Implémenter `handleUploadCV()` avec FormData
- [ ] Ajouter interface `User` avec champs `cv_path` et `cover_letter_template`
- [ ] Afficher badge "CV Uploadé" / "Pas de CV"
- [ ] Message d'avertissement si analyse sans CV
- [ ] Tester upload PDF (max 10 MB)
- [ ] Tester analyse match avec et sans CV

---

## 🚀 ÉVOLUTIONS FUTURES

### Phase 2 - Parsing CV avec IA (TODO Backend)
```python
# Backend va implémenter:
def parse_cv_with_ai(cv_path: str) -> CandidateProfile:
    # 1. Extraire texte du PDF (PyPDF2)
    # 2. Envoyer à OpenAI pour extraction structurée
    # 3. Retourner profil complet:
    #    - Compétences techniques
    #    - Années d'expérience
    #    - Formation
    #    - Langues
    #    - Certifications
```

### Phase 3 - Import LinkedIn (TODO)
```typescript
// Frontend:
<Button onClick={handleImportLinkedIn}>
  Importer depuis LinkedIn
</Button>

// Backend:
POST /users/import-linkedin
Body: { linkedin_url: "https://linkedin.com/in/..." }
```

---

## ✅ RÉSUMÉ

**Modifications minimales requises:**
1. ✅ Token JWT déjà envoyé → Aucun changement
2. 🆕 Ajouter page/section Upload CV
3. 🆕 Ajouter badge "CV Uploadé"
4. 🆕 Avertissement si analyse sans CV

**Le backend gère:**
- ✅ Extraction du user_id depuis le token
- ✅ Chargement du CV
- ✅ Calcul du match personnalisé
- 🔄 Parsing AI du CV (TODO - Phase 2)

---

**Questions ?** Le match fonctionne déjà, mais sera plus précis une fois le CV uploadé et parsé par l'IA.
