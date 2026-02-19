# 📋 TODO Backend - ApplyFlow

**Date:** 5 décembre 2025  
**Priorité:** Critique pour que le frontend fonctionne  
**Status:** 🔄 Analyse après migration multi-user

---

## 📊 ÉTAT DES LIEUX (Comparaison Backend vs Frontend)

### ✅ CE QUI EST DÉJÀ FAIT AU BACKEND

1. ✅ **Authentification OAuth2** - FAIT
   - Login avec form-data (username/password) ✅
   - Register fonctionnel ✅
   - JWT tokens ✅

2. ✅ **Isolation Multi-User** - FAIT
   - Tous les endpoints filtrent par `user_id` ✅
   - GET /job-offers/ retourne seulement les offres de l'utilisateur ✅
   - GET /applications/ retourne seulement les candidatures de l'utilisateur ✅
   - Validation ownership sur PUT/DELETE ✅

3. ✅ **Colonnes User** - FAIT
   - `cv_file_path` ajouté ✅
   - `cv_text` ajouté ✅
   - `linkedin_url` ajouté ✅
   - `profile_summary` ajouté ✅

4. ✅ **Upload de CV** - FAIT
   - POST /users/upload-cv fonctionnel ✅
   - Extraction de texte avec PyPDF2 ✅
   - Stockage dans `cv_file_path` et `cv_text` ✅

5. ✅ **Validation CV** - FAIT
   - POST /job-matches/analyze vérifie le CV ✅
   - POST /drafts/generate vérifie le CV ✅
   - Erreur 400 avec message clair si CV manquant ✅

6. ✅ **Endpoint Send Draft** - FAIT
   - POST /drafts/{draft_id}/send existe ✅
   - Crée une Application automatiquement ✅
   - Met à jour le draft status à "sent" ✅

---

## 🔴 CE QUI MANQUE ENCORE (Bloquants Frontend)

### 1. ✅ Authentification OAuth2 (FAIT?)
**Status:** À vérifier  
**Endpoint:** `POST /api/v1/auth/login`

```python
# VÉRIFIER que vous utilisez OAuth2PasswordRequestForm
from fastapi.security import OAuth2PasswordRequestForm

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # ⚠️ form_data.username contient l'EMAIL
    # ⚠️ PAS JSON, c'est du form-data !
    user = authenticate(email=form_data.username, password=form_data.password)
    token = create_access_token(user_id=user.id)
    return {"access_token": token, "token_type": "bearer"}
```

**Test:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=test123"
```

---

### 2. ⚠️ Filtrage par User ID (CRITIQUE)
**Status:** À implémenter  
**Endpoints affectés:**
- `GET /api/v1/job-offers/`
- `GET /api/v1/applications/`

```python
# ❌ AVANT (mauvais - retourne TOUT)
@router.get("/job-offers/")
def get_job_offers(db: Session = Depends(get_db)):
    return db.query(JobOffer).all()  # ⚠️ Retourne toutes les offres de tous les users !

# ✅ APRÈS (correct)
@router.get("/job-offers/")
def get_job_offers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(JobOffer).filter(
        JobOffer.user_id == current_user.id  # ✅ Filtre par user
    ).all()
```

**Faire pareil pour:**
- ✅ `GET /job-offers/` → Filtrer par `user_id`
- ✅ `GET /job-offers/{id}` → Vérifier `user_id`
- ✅ `PUT /job-offers/{id}` → Vérifier `user_id`
- ✅ `DELETE /job-offers/{id}` → Vérifier `user_id`
- ✅ `GET /applications/` → Filtrer via `job_offer.user_id`
- ✅ `GET /applications/{id}` → Vérifier via `job_offer.user_id`

---

### 3. 🆕 Ajouter Colonnes User (CRITIQUE)
**Status:** À faire  
**Table:** `users`

```python
# Migration Alembic
def upgrade():
    op.add_column('users', sa.Column('cv_path', sa.String(), nullable=True))
    op.add_column('users', sa.Column('cover_letter_template', sa.Text(), nullable=True))

# Modèle SQLAlchemy
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    cv_path = Column(String, nullable=True)  # ✅ NOUVEAU
    cover_letter_template = Column(Text, nullable=True)  # ✅ NOUVEAU
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

**Commandes:**
```bash
# Créer la migration
alembic revision --autogenerate -m "Add cv_path and cover_letter_template to users"

# Appliquer
alembic upgrade head
```

---

### 4. 📤 Upload de CV (CRITIQUE)
**Status:** À créer  
**Endpoint:** `POST /api/v1/users/upload-cv`

```python
from fastapi import UploadFile, File
import os

@router.post("/users/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Vérifier le format
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files are allowed")
    
    # Vérifier la taille (max 10 MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10 MB)")
    
    # Créer le dossier
    os.makedirs("uploads/cv", exist_ok=True)
    
    # Sauvegarder avec un nom unique
    file_path = f"uploads/cv/{current_user.id}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Mettre à jour le user
    current_user.cv_path = file_path
    db.commit()
    
    return {"file_path": file_path}
```

**Test:**
```bash
curl -X POST http://localhost:8000/api/v1/users/upload-cv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@cv.pdf"
```

---

### 5. 🎯 Utiliser le CV Utilisateur (CRITIQUE)
**Status:** À modifier  
**Endpoint:** `POST /api/v1/job-matches/analyze/{job_offer_id}`

```python
# ❌ AVANT (utilise profil par défaut)
@router.post("/job-matches/analyze/{job_offer_id}")
def analyze_match(job_offer_id: int, ...):
    profile = DEFAULT_CANDIDATE  # ⚠️ Profil générique !
    analysis = ai_analyze_match(job_description, profile)
    # ...

# ✅ APRÈS (utilise le CV de l'utilisateur)
@router.post("/job-matches/analyze/{job_offer_id}")
def analyze_match(
    job_offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Récupérer l'offre et vérifier ownership
    offer = db.query(JobOffer).filter(
        JobOffer.id == job_offer_id,
        JobOffer.user_id == current_user.id
    ).first()
    
    if not offer:
        raise HTTPException(404, "Job offer not found")
    
    # Utiliser le CV de l'utilisateur
    if current_user.cv_path:
        # Parser le CV (PyPDF2, pdfplumber, etc.)
        candidate_profile = parse_cv_to_profile(current_user.cv_path)
    else:
        # Optionnel: utiliser profil générique ou retourner erreur
        candidate_profile = DEFAULT_CANDIDATE
    
    # Analyser avec l'IA
    analysis = ai_analyze_match(offer.raw_description, candidate_profile)
    
    # Sauvegarder le résultat
    match = JobMatch(
        job_offer_id=job_offer_id,
        score=analysis["score"],
        reasons=analysis["reasons"],
        skills_detected=analysis["skills"],
        red_flags=analysis["red_flags"]
    )
    db.add(match)
    db.commit()
    
    return match
```

---

### 6. ✉️ Générer Draft avec CV (CRITIQUE)
**Status:** À modifier  
**Endpoint:** `POST /api/v1/drafts/{job_offer_id}`

```python
@router.post("/drafts/{job_offer_id}")
def generate_draft(
    job_offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Vérifier ownership
    offer = db.query(JobOffer).filter(
        JobOffer.id == job_offer_id,
        JobOffer.user_id == current_user.id
    ).first()
    
    if not offer:
        raise HTTPException(404, "Job offer not found")
    
    # ⚠️ VÉRIFIER que le CV existe
    if not current_user.cv_path:
        raise HTTPException(
            400,
            detail="You must upload your CV before generating a cover letter"
        )
    
    # Parser le CV
    candidate_profile = parse_cv_to_profile(current_user.cv_path)
    
    # Utiliser le template de l'utilisateur
    template = current_user.cover_letter_template or DEFAULT_TEMPLATE
    
    # Générer avec l'IA
    result = ai_generate_cover_letter(
        job_description=offer.raw_description,
        candidate_profile=candidate_profile,
        template=template,
        company=offer.company,
        position=offer.title,
        candidate_name=current_user.name
    )
    
    # Sauvegarder
    draft = ApplicationDraft(
        job_offer_id=job_offer_id,
        cover_letter_text=result["cover_letter"],
        email_subject=result["email_subject"],
        email_body=result["email_body"],
        status="draft"
    )
    db.add(draft)
    db.commit()
    
    return draft
```

---

## 🟡 IMPORTANTES (Fonctionnalité Clé)

### 7. 🔍 Scraping d'Offres (NOUVEAU)
**Status:** À créer  
**Endpoint:** `POST /api/v1/job-offers/scrape`

**Option A: Scraping Direct (Selenium)**
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup

@router.post("/job-offers/scrape")
async def scrape_job_offer(
    data: ScrapeRequest,
    current_user: User = Depends(get_current_user)
):
    url = str(data.url)
    
    # Détecter la plateforme
    if "linkedin.com" in url:
        return scrape_linkedin(url)
    elif "indeed.com" in url:
        return scrape_indeed(url)
    elif "welcometothejungle.com" in url:
        return scrape_wttj(url)
    else:
        raise HTTPException(
            400,
            detail="Platform not supported. Please enter job details manually."
        )

def scrape_linkedin(url: str):
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        
        title = driver.find_element(By.CSS_SELECTOR, "h1").text
        company = driver.find_element(By.CSS_SELECTOR, ".topcard__org-name-link").text
        # ... etc
        
        return {
            "title": title,
            "company": company,
            "location": location,
            "description": description,
            "application_type": "portal",
            "application_url": url
        }
    finally:
        driver.quit()
```

**Option B: API Externe (Recommandé)**
```python
import requests

@router.post("/job-offers/scrape")
async def scrape_job_offer(data: ScrapeRequest, ...):
    # Utiliser Scrapin.io ou similaire
    response = requests.post(
        "https://api.scrapin.io/enrichment/job",
        json={"url": str(data.url)},
        headers={"Authorization": f"Bearer {SCRAPIN_API_KEY}"}
    )
    
    data = response.json()
    
    return {
        "title": data["title"],
        "company": data["company"]["name"],
        "location": data.get("location"),
        "description": data["description"],
        "application_type": "portal",
        "application_url": data.get("applyUrl")
    }
```

**Dépendances:**
```bash
# Option A
pip install selenium beautifulsoup4 webdriver-manager

# Option B
pip install requests
```

---

### 8. 📨 Envoyer Candidature
**Status:** À vérifier  
**Endpoint:** `POST /api/v1/drafts/{draft_id}/send`

```python
@router.post("/drafts/{draft_id}/send")
def send_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Récupérer le draft
    draft = db.query(ApplicationDraft).filter(
        ApplicationDraft.id == draft_id
    ).first()
    
    if not draft:
        raise HTTPException(404, "Draft not found")
    
    # Vérifier ownership via job_offer
    offer = db.query(JobOffer).filter(
        JobOffer.id == draft.job_offer_id,
        JobOffer.user_id == current_user.id
    ).first()
    
    if not offer:
        raise HTTPException(404, "Not authorized")
    
    # Créer une application
    application = Application(
        job_offer_id=draft.job_offer_id,
        channel=offer.application_type,
        submitted_by="user",
        status="pending",
        sent_at=datetime.utcnow()
    )
    db.add(application)
    
    # Marquer le draft comme envoyé
    draft.status = "sent"
    
    db.commit()
    
    # Optionnel: envoyer vraiment l'email
    # if offer.application_type == "email":
    #     send_email(
    #         to=offer.application_url,
    #         subject=draft.email_subject,
    #         body=draft.email_body
    #     )
    
    return {"message": "Application sent successfully"}
```

---

## 🟢 AMÉLIORATIONS (Optionnelles)

### 9. 📄 Parser CV avec IA (Recommandé)
**Status:** Future amélioration  

```python
import openai
from pdfplumber import PDF

def parse_cv_to_profile(cv_path: str) -> dict:
    # Extraire le texte du PDF
    with pdfplumber.open(cv_path) as pdf:
        text = "\n".join([page.extract_text() for page in pdf.pages])
    
    # Utiliser GPT-4 pour structurer
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{
            "role": "system",
            "content": "Extract structured profile from CV. Return JSON with: skills, experience_years, education, languages, certifications."
        }, {
            "role": "user",
            "content": text
        }]
    )
    
    return json.loads(response.choices[0].message.content)
```

---

### 10. 🔒 Rate Limiting
**Status:** Recommandé pour production

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/job-offers/scrape")
@limiter.limit("10/minute")  # Max 10 scrapes par minute
async def scrape_job_offer(...):
    # ...
```

---

## 📊 Checklist Complète

### Authentification
- [ ] `POST /auth/login` accepte `form-data` (pas JSON)
- [ ] Champ `username` contient l'email (pas "email")
- [ ] JWT token généré correctement
- [ ] `get_current_user()` extrait user_id du token

### Modèles
- [ ] Colonne `user_id` sur `job_offers` table
- [ ] Colonnes `cv_path` et `cover_letter_template` sur `users`
- [ ] Foreign keys correctes
- [ ] Migrations Alembic appliquées

### Endpoints - Job Offers
- [ ] `GET /job-offers/` filtre par `current_user.id`
- [ ] `POST /job-offers/` lie automatiquement à `current_user.id`
- [ ] `GET /job-offers/{id}` vérifie ownership
- [ ] `PUT /job-offers/{id}` vérifie ownership
- [ ] `DELETE /job-offers/{id}` vérifie ownership
- [ ] `POST /job-offers/scrape` créé et fonctionnel

### Endpoints - Users
- [ ] `GET /users/me` retourne `cv_path` et `cover_letter_template`
- [ ] `PUT /users/me` accepte ces champs
- [ ] `POST /users/upload-cv` créé (multipart/form-data)
- [ ] `POST /users/change-password` fonctionne

### Endpoints - Matches
- [ ] `POST /job-matches/analyze/{id}` utilise le CV de l'utilisateur
- [ ] `GET /job-matches/{job_offer_id}` vérifie ownership

### Endpoints - Drafts
- [ ] `POST /drafts/{job_id}` vérifie que CV existe (erreur 400 sinon)
- [ ] `POST /drafts/{job_id}` utilise `cover_letter_template` de l'user
- [ ] `GET /drafts/{job_id}` vérifie ownership
- [ ] `PUT /drafts/{id}` vérifie ownership
- [ ] `POST /drafts/{id}/send` crée une Application

### Endpoints - Applications
- [ ] `GET /applications/` filtre par user (via job_offers.user_id)
- [ ] `GET /applications/{id}` vérifie ownership
- [ ] `POST /applications/` lie à user
- [ ] `PUT /applications/{id}` vérifie ownership

### Configuration
- [ ] CORS configuré pour `localhost:5173` et `localhost:5174`
- [ ] `allow_credentials=True` dans CORS
- [ ] JWT secret key sécurisée (variable d'environnement)
- [ ] Dossier `uploads/cv/` créé avec bonnes permissions

### Erreurs
- [ ] 400 retourne `{"detail": "message clair"}`
- [ ] 401 retourne quand token invalide/expiré
- [ ] 404 retourne quand ressource n'existe pas
- [ ] 403 retourne quand pas de permission (ownership)

---

## 🧪 Tests de Validation

### Test 1: Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=test123"

# Réponse attendue:
# {"access_token": "eyJ...", "token_type": "bearer"}
```

### Test 2: Get User (avec token)
```bash
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Réponse attendue:
# {"id": 1, "email": "...", "name": "...", "cv_path": null, "cover_letter_template": null, ...}
```

### Test 3: Upload CV
```bash
curl -X POST http://localhost:8000/api/v1/users/upload-cv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@cv.pdf"

# Réponse attendue:
# {"file_path": "uploads/cv/1_cv.pdf"}
```

### Test 4: Create Job Offer
```bash
curl -X POST http://localhost:8000/api/v1/job-offers/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "company": "TestCorp",
    "source": "Manual",
    "application_type": "email",
    "raw_description": "Test description"
  }'

# Réponse attendue:
# {"id": 1, "title": "Test Job", "user_id": 1, ...}
```

### Test 5: Scrape Job (si implémenté)
```bash
curl -X POST http://localhost:8000/api/v1/job-offers/scrape \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.linkedin.com/jobs/view/123/"}'

# Réponse attendue:
# {"title": "...", "company": "...", "description": "...", ...}
```

---

## 🚀 Ordre d'Implémentation Recommandé

1. **Semaine 1: Fondations**
   - ✅ Vérifier OAuth2 login (form-data)
   - ✅ Ajouter colonnes `cv_path` et `cover_letter_template`
   - ✅ Créer endpoint upload CV
   - ✅ Filtrer job-offers par user_id

2. **Semaine 2: Intelligence**
   - ✅ Modifier analyse match (utiliser CV user)
   - ✅ Modifier génération draft (utiliser CV + template)
   - ✅ Parser CV basique (extraire texte)

3. **Semaine 3: Scraping**
   - ✅ Créer endpoint scrape (LinkedIn seulement)
   - ✅ Ajouter Indeed et WTTJ
   - ✅ Rate limiting

4. **Semaine 4: Polish**
   - ✅ Parser CV avec IA (GPT-4)
   - ✅ Tests end-to-end
   - ✅ Documentation API

---

## 📞 Support

**Si un test échoue:**
1. Vérifier les logs backend (`uvicorn` console)
2. Vérifier la structure des données envoyées (Postman/curl)
3. Vérifier que le token JWT est valide
4. Vérifier CORS si erreur réseau

**Frontend prêt à 100% ✅**  
**Backend: Suivre cette checklist** 📋
