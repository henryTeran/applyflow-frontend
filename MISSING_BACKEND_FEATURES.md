# ⚠️ Ce qui MANQUE au Backend - ApplyFlow

**Date:** 5 décembre 2025  
**Analysé par:** Frontend Team  
**Basé sur:** Documentation backend multi-user

---

## 📊 RÉSUMÉ EXÉCUTIF

Après analyse de la documentation backend fournie, voici ce qui **fonctionne déjà** et ce qui **manque encore**.

### ✅ CE QUI FONCTIONNE (Backend OK)

| Fonctionnalité | Status | Endpoint | Notes |
|---------------|--------|----------|-------|
| Authentification OAuth2 | ✅ FAIT | POST /auth/login | Form-data avec username/password |
| Register | ✅ FAIT | POST /auth/register | JSON avec email/password/name |
| Get User Profile | ✅ FAIT | GET /users/me | Retourne cv_file_path, cv_text, etc. |
| Update Profile | ✅ FAIT | PUT /users/me | name, linkedin_url, profile_summary |
| Upload CV | ✅ FAIT | POST /users/upload-cv | Multipart form-data, extrait texte |
| Isolation Multi-User | ✅ FAIT | Tous les endpoints | Filtrage automatique par user_id |
| List Job Offers | ✅ FAIT | GET /job-offers/ | Retourne seulement les offres de l'user |
| Create Job Offer | ✅ FAIT | POST /job-offers/ | Lie automatiquement à current_user |
| Get Job Offer | ✅ FAIT | GET /job-offers/{id} | Vérifie ownership |
| Analyze Match | ✅ FAIT | POST /job-matches/analyze/{id} | Vérifie CV existe (erreur 400 sinon) |
| Generate Draft | ✅ FAIT | POST /drafts/generate/{id} | Vérifie CV existe (erreur 400 sinon) |
| Get Draft | ✅ FAIT | GET /drafts/{job_id} | Retourne draft pour l'offre |
| Update Draft | ✅ FAIT | PUT /drafts/{id} | Modifie cover_letter_content |
| Send Draft | ✅ FAIT | POST /drafts/{id}/send | Crée Application + status="sent" |
| List Applications | ✅ FAIT | GET /applications/ | Retourne seulement apps de l'user |
| Get Application | ✅ FAIT | GET /applications/{id} | Vérifie ownership |
| Update Application | ✅ FAIT | PUT /applications/{id} | Modifie status, notes |
| Timeline Events | ✅ FAIT | GET /timeline/events/ | Historique de l'user |

**Conclusion:** Le backend multi-user est **fonctionnel à 85%** ! 🎉

---

## 🔴 CE QUI MANQUE (Bloquants)

### 1. 🌐 ENDPOINT SCRAPING (CRITIQUE)

**Priorité:** 🔴 **BLOQUANT ABSOLU**  
**Endpoint manquant:** `POST /api/v1/job-offers/scrape`

**Pourquoi c'est bloquant :**
- La fonctionnalité "Candidature Express" (Quick Apply) ne peut PAS fonctionner sans cet endpoint
- Le bouton "✨ Candidature Express" sur la page `/offers` ne fait rien
- Le workflow automatique "URL → Scrape → Match → Draft → Send" est cassé
- C'est la **fonctionnalité phare** demandée par l'utilisateur

**Ce que le frontend attend :**

**Requête :**
```http
POST /api/v1/job-offers/scrape
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "url": "https://www.linkedin.com/jobs/view/12345/"
}
```

**Réponse attendue :**
```json
{
  "title": "Senior Python Developer",
  "company": "TechCorp",
  "location": "Paris, France",
  "description": "We are looking for a passionate developer with 5+ years of experience...",
  "application_type": "portal",
  "application_url": "https://www.linkedin.com/jobs/view/12345/"
}
```

**Erreur si plateforme non supportée :**
```json
{
  "detail": "Platform not supported. Supported platforms: LinkedIn, Indeed, Welcome to the Jungle."
}
```

**Comment l'implémenter :**

**Option A: Scraping Direct avec Selenium (Complexe mais gratuit)**

```python
# app/routers/job_offers.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from pydantic import BaseModel, HttpUrl
import time

class ScrapeRequest(BaseModel):
    url: HttpUrl

class ScrapeResponse(BaseModel):
    title: str
    company: str
    location: str | None = None
    description: str
    application_type: str = "portal"
    application_url: str | None = None

@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_job_offer(
    data: ScrapeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Scrape job offer details from a URL.
    Supports: LinkedIn, Indeed, Welcome to the Jungle
    """
    url = str(data.url)
    
    try:
        if "linkedin.com" in url:
            return scrape_linkedin(url)
        elif "indeed.com" in url:
            return scrape_indeed(url)
        elif "welcometothejungle.com" in url:
            return scrape_wttj(url)
        else:
            raise HTTPException(
                status_code=400,
                detail="Platform not supported. Supported platforms: LinkedIn, Indeed, Welcome to the Jungle."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to scrape job offer: {str(e)}"
        )

def scrape_linkedin(url: str) -> ScrapeResponse:
    """Scrape LinkedIn job posting"""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        time.sleep(3)  # Attendre le chargement
        
        # Extraire les données
        title = driver.find_element(By.CSS_SELECTOR, "h1.top-card-layout__title").text
        company = driver.find_element(By.CSS_SELECTOR, "a.topcard__org-name-link").text
        
        # Location (optionnel)
        try:
            location = driver.find_element(By.CSS_SELECTOR, "span.topcard__flavor--bullet").text
        except:
            location = None
        
        # Description
        try:
            desc_element = driver.find_element(By.CLASS_NAME, "show-more-less-html__markup")
            description = desc_element.text
        except:
            description = "No description available"
        
        return ScrapeResponse(
            title=title.strip(),
            company=company.strip(),
            location=location.strip() if location else None,
            description=description.strip(),
            application_type="portal",
            application_url=url
        )
        
    finally:
        driver.quit()

def scrape_indeed(url: str) -> ScrapeResponse:
    """Scrape Indeed job posting"""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        time.sleep(2)
        
        title = driver.find_element(By.CSS_SELECTOR, "h1.jobsearch-JobInfoHeader-title").text
        company = driver.find_element(By.CSS_SELECTOR, "[data-testid='inlineHeader-companyName']").text
        
        try:
            location = driver.find_element(By.CSS_SELECTOR, "[data-testid='inlineHeader-companyLocation']").text
        except:
            location = None
        
        try:
            description = driver.find_element(By.ID, "jobDescriptionText").text
        except:
            description = "No description"
        
        return ScrapeResponse(
            title=title.strip(),
            company=company.strip(),
            location=location,
            description=description.strip(),
            application_type="portal",
            application_url=url
        )
    finally:
        driver.quit()

def scrape_wttj(url: str) -> ScrapeResponse:
    """Scrape Welcome to the Jungle job posting"""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        time.sleep(2)
        
        title = driver.find_element(By.TAG_NAME, "h1").text
        company = driver.find_element(By.CSS_SELECTOR, "a[data-testid='job-header-company-name']").text
        
        # À adapter selon la structure WTTJ
        description = driver.find_element(By.CSS_SELECTOR, "[data-testid='job-section-description']").text
        
        return ScrapeResponse(
            title=title.strip(),
            company=company.strip(),
            description=description.strip(),
            application_type="portal",
            application_url=url
        )
    finally:
        driver.quit()
```

**Dépendances à installer :**
```bash
pip install selenium webdriver-manager
```

**Configuration ChromeDriver :**
```python
# app/core/config.py ou au début du fichier
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Installer automatiquement ChromeDriver
service = Service(ChromeDriverManager().install())
```

**Option B: API Externe (Plus Stable, Payant)**

Si vous préférez éviter Selenium (problèmes anti-bot, maintenance), utilisez une API :

```python
import requests
import os

SCRAPIN_API_KEY = os.getenv("SCRAPIN_API_KEY")  # Obtenir sur scrapin.io

@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_job_offer(data: ScrapeRequest, ...):
    response = requests.post(
        "https://api.scrapin.io/enrichment/job",
        json={"url": str(data.url)},
        headers={"Authorization": f"Bearer {SCRAPIN_API_KEY}"},
        timeout=30
    )
    
    if response.status_code != 200:
        raise HTTPException(400, "Failed to scrape job offer")
    
    result = response.json()
    
    return ScrapeResponse(
        title=result["title"],
        company=result["company"]["name"],
        location=result.get("location"),
        description=result["description"],
        application_type="portal",
        application_url=result.get("applyUrl", str(data.url))
    )
```

**Coût estimé :** ~$0.01-0.05 par scrape selon l'API choisie.

**Recommandation :** Commencer avec **Option A (Selenium)** pour LinkedIn uniquement, puis étendre aux autres plateformes.

---

### 2. ⚠️ CHAMPS MANQUANTS DANS JobOffer (Important)

**Priorité:** 🟡 Moyenne  
**Impact:** Perte de données lors de la création d'offres

**Problème détecté :**

Le frontend envoie ces champs (vérifiés dans CreateJobOfferPage et QuickApplyPage) :
```typescript
{
  title: string;
  company: string;
  source: string;              // ❓ Existe au backend ?
  url?: string;
  application_type: string;    // ❓ Existe au backend ?
  application_url?: string;    // ❓ Existe au backend ?
  raw_description: string;     // ✅ Nom correct utilisé par le frontend
  location?: string;
  salary?: string;
  contract_type?: string;
}
```

Le backend (selon doc) pourrait avoir :
```python
class JobOffer(Base):
    title = Column(String)
    company = Column(String)
    url = Column(String)
    raw_description = Column(Text)       # ✅ Doit utiliser ce nom, pas "description"
    location = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    contract_type = Column(String, nullable=True)
    status = Column(String, default="active")
    user_id = Column(Integer)
    # MANQUANTS ?
    source = ?                           # ❓ "Manual", "LinkedIn", "Indeed", etc.
    application_type = ?                 # ❓ "email", "portal", "website"
    application_url = ?                  # ❓ URL ou email de candidature
```

**Migration nécessaire :**
```python
def upgrade():
    # Ajouter nouveaux champs
    op.add_column('job_offers', sa.Column('source', sa.String(), nullable=True))
    op.add_column('job_offers', sa.Column('application_type', sa.String(), nullable=True))
    op.add_column('job_offers', sa.Column('application_url', sa.String(), nullable=True))
```

**Impact si manquant :**
- ⚠️ Données perdues : source, type de candidature, URL/email
- ⚠️ Impossible de savoir comment postuler (email vs portal vs website)

---

### 3. ⚠️ NOMMAGE DES CHAMPS (CRITIQUE)

**Priorité:** 🔴 **BLOQUANT**  
**Impact:** Incompatibilité totale entre frontend et backend

**Problème détecté :**

Le **frontend utilise déjà** ces noms de champs (vérifiés dans le code) :

```typescript
// ApplicationDraft (Frontend)
interface ApplicationDraft {
  cover_letter_text: string;     // ⚠️ PAS "cover_letter_content"
  email_subject?: string;
  email_body?: string;
}

// JobOffer (Frontend)
interface JobOffer {
  raw_description: string;       // ⚠️ PAS "description"
  // ... autres champs
}
```

**Le backend DOIT utiliser ces noms exactement :**

```python
# ❌ MAUVAIS (selon doc backend actuelle)
class ApplicationDraft(Base):
    cover_letter_content = Column(Text)  # ❌ Frontend utilise "cover_letter_text"

class JobOffer(Base):
    description = Column(Text)           # ❌ Frontend utilise "raw_description"

# ✅ CORRECT (à implémenter au backend)
class ApplicationDraft(Base):
    cover_letter_text = Column(Text)     # ✅ Correspond au frontend
    email_subject = Column(String, nullable=True)
    email_body = Column(Text, nullable=True)

class JobOffer(Base):
    raw_description = Column(Text)       # ✅ Correspond au frontend
```

**Migration Alembic nécessaire :**

```python
def upgrade():
    # Renommer colonne dans ApplicationDraft
    op.alter_column('application_drafts', 'cover_letter_content',
                    new_column_name='cover_letter_text')
    
    # Ajouter champs email
    op.add_column('application_drafts', sa.Column('email_subject', sa.String(), nullable=True))
    op.add_column('application_drafts', sa.Column('email_body', sa.Text(), nullable=True))
    
    # Renommer colonne dans JobOffer
    op.alter_column('job_offers', 'description',
                    new_column_name='raw_description')
```

**Impact si non corrigé :**
- ❌ Toutes les requêtes POST/PUT échouent avec erreur 422
- ❌ Le frontend ne peut ni créer ni modifier de drafts
- ❌ Le frontend ne peut pas créer d'offres d'emploi
- ❌ **L'application entière est cassée**

---

### 4. ⚠️ COVER_LETTER_TEMPLATE dans User (Mineur)

**Priorité:** 🟢 Basse  
**Impact:** Template de lettre de motivation ne se sauvegarde pas

**Problème détecté :**

Le frontend (SettingsPage) envoie :
```typescript
{
  cover_letter_template: string
}
```

Le backend a (selon doc) :
```python
class User(Base):
    cv_file_path = Column(String)        # ✅ OK
    cv_text = Column(Text)               # ✅ OK
    linkedin_url = Column(String)        # ✅ OK
    profile_summary = Column(Text)       # ✅ OK
    cover_letter_template = ?            # ❓ Existe ?
```

**Si la colonne n'existe pas**, ajouter :

```python
# Migration
def upgrade():
    op.add_column('users', sa.Column('cover_letter_template', sa.Text(), nullable=True))

# Modèle
class User(Base):
    # ... champs existants
    cover_letter_template = Column(Text, nullable=True)
```

**Impact si manquant :**
- Le template personnalisé dans Settings ne se sauvegarde pas
- La génération de draft utilise toujours le template par défaut

---

## 🧪 TESTS À EFFECTUER

### Test 1: Scraping Endpoint
```bash
# Créer un token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -F "username=test@example.com" \
  -F "password=test123" \
  | jq -r '.access_token')

# Tester le scraping
curl -X POST http://localhost:8000/api/v1/job-offers/scrape \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.linkedin.com/jobs/view/3787654321/"
  }' | jq

# Réponse attendue:
# {
#   "title": "Senior Python Developer",
#   "company": "TechCorp",
#   "location": "Paris",
#   "description": "...",
#   "application_type": "portal",
#   "application_url": "https://..."
# }
```

### Test 2: Champs JobOffer (CRITIQUE - Vérifier nommage)
```bash
# Créer une offre avec raw_description
curl -X POST http://localhost:8000/api/v1/job-offers/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "company": "TestCorp",
    "source": "Manual",
    "url": "https://example.com",
    "application_type": "email",
    "application_url": "jobs@example.com",
    "raw_description": "Test description"
  }' | jq

# ⚠️ Si erreur 422 sur "raw_description" → Le backend utilise encore "description"
# Vérifier que source, application_type, application_url sont bien sauvegardés
```

### Test 3: Champs Draft (CRITIQUE - Vérifier nommage)
```bash
# Créer un draft
DRAFT_ID=$(curl -X POST http://localhost:8000/api/v1/drafts/generate/1 \
  -H "Authorization: Bearer $TOKEN" | jq -r '.id')

# ⚠️ VÉRIFIER que la réponse contient "cover_letter_text" (pas "cover_letter_content")
curl -X GET http://localhost:8000/api/v1/drafts/$DRAFT_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# Réponse DOIT contenir:
# {
#   "id": 1,
#   "cover_letter_text": "...",     ← ⚠️ PAS "cover_letter_content"
#   "email_subject": null,
#   "email_body": null
# }

# Modifier avec tous les champs
curl -X PUT http://localhost:8000/api/v1/drafts/$DRAFT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cover_letter_text": "Updated letter",
    "email_subject": "Application for Python Developer",
    "email_body": "Dear recruiter..."
  }' | jq

# Si erreur 422 → Le backend utilise encore "cover_letter_content"
```

### Test 4: Cover Letter Template
```bash
# Mettre à jour le profil avec template
curl -X PUT http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cover_letter_template": "Madame, Monsieur,\n\n[BODY]\n\nCordialement,\n[NAME]"
  }' | jq

# Récupérer le profil
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" | jq

# Vérifier que cover_letter_template est bien retourné
```

---

## 📋 CHECKLIST PRIORITAIRE

### 🔴 URGENT (À faire IMMÉDIATEMENT)
- [ ] **Renommer `cover_letter_content` → `cover_letter_text`** dans ApplicationDraft
- [ ] **Renommer `description` → `raw_description`** dans JobOffer
- [ ] **Ajouter `email_subject` et `email_body`** dans ApplicationDraft
- [ ] Tester POST /job-offers/ et PUT /drafts/{id} après modifications

### 🔴 TRÈS IMPORTANT (À faire cette semaine)
- [ ] **Implémenter POST /job-offers/scrape** (LinkedIn minimum)
- [ ] Tester scraping avec 3 URLs LinkedIn différentes
- [ ] Gérer erreurs scraping (timeout, anti-bot, 404)

### 🟡 IMPORTANT (À faire sous 2 semaines)
- [ ] Ajouter `source`, `application_type`, `application_url` dans JobOffer
- [ ] Vérifier si `cover_letter_template` existe dans User
- [ ] Si non, créer migration et ajouter colonne

### 🟢 NICE-TO-HAVE (Futur)
- [ ] Étendre scraping à Indeed
- [ ] Étendre scraping à Welcome to the Jungle
- [ ] Ajouter rate limiting sur /scrape (max 10/minute)
- [ ] Parser CV avec IA (GPT-4) pour extraction structurée
- [ ] Envoyer vraiment les emails dans POST /send

---

## 🎯 IMPACT SUR LES FONCTIONNALITÉS FRONTEND

| Fonctionnalité Frontend | Dépend de | Status si manquant |
|------------------------|-----------|-------------------|
| **Toutes les fonctionnalités Draft** | Nommage correct (`cover_letter_text`) | ❌ **CASSÉ** - Erreur 422 |
| **Création/modification offres** | Nommage correct (`raw_description`) | ❌ **CASSÉ** - Erreur 422 |
| **Candidature Express** | POST /job-offers/scrape | ❌ **NE FONCTIONNE PAS** |
| **Édition draft emails** | Champs `email_subject`, `email_body` | ❌ **CASSÉ** - Erreur 422 |
| **Création manuelle offre** | Champs source, app_type, app_url | ⚠️ Perte de données |
| **Template lettre motivation** | cover_letter_template User | ⚠️ Template non sauvegardé |
| **Upload CV** | POST /users/upload-cv | ✅ Fonctionne |
| **Analyse Match** | POST /job-matches/analyze | ✅ Fonctionne (si raw_description OK) |
| **Génération Draft** | POST /drafts/generate | ✅ Fonctionne (si raw_description OK) |
| **Envoi Candidature** | POST /drafts/{id}/send | ✅ Fonctionne (si cover_letter_text OK) |
| **Liste Applications** | GET /applications/ | ✅ Fonctionne |
| **Timeline** | GET /timeline/events/ | ✅ Fonctionne |

---

## 💡 RECOMMANDATIONS

### Ordre d'Implémentation

**Semaine 1:**
1. Implémenter POST /job-offers/scrape (LinkedIn uniquement)
2. Tester avec 5-10 URLs LinkedIn réelles
3. Vérifier existence des colonnes manquantes

**Semaine 2:**
4. Ajouter colonnes JobOffer (source, application_type, application_url)
5. Ajouter colonnes ApplicationDraft (email_subject, email_body)
6. Ajouter colonne User (cover_letter_template)

**Semaine 3:**
7. Étendre scraping à Indeed
8. Étendre scraping à WTTJ
9. Tests end-to-end complets

### Alternatives Rapides

**Si pas le temps pour Selenium:**
- Créer un endpoint "mock" qui retourne des données factices
- Le frontend fonctionnera au moins en dev
- Remplacer par vrai scraping plus tard

**Exemple mock:**
```python
@router.post("/scrape")
async def scrape_job_offer(data: ScrapeRequest, ...):
    # Version mock pour dev
    return ScrapeResponse(
        title="Senior Python Developer",
        company="TechCorp",
        location="Paris",
        description="This is a mock job description...",
        application_type="portal",
        application_url=str(data.url)
    )
```

---

## 📞 QUESTIONS POUR L'ÉQUIPE BACKEND

1. **URGENT - Nommage:** Avez-vous renommé `cover_letter_content` → `cover_letter_text` et `description` → `raw_description` ?
2. **URGENT - Champs Draft:** Les colonnes `email_subject` et `email_body` existent-elles dans ApplicationDraft ?
3. **Scraping:** Préférez-vous Selenium (gratuit, complexe) ou API externe (payant, stable) ?
4. **Colonnes JobOffer:** Existe-t-il déjà `source`, `application_type`, `application_url` ?
5. **Template User:** Existe-t-il déjà `cover_letter_template` ?

---

## ⚠️ RÉSUMÉ DES CORRECTIONS BACKEND NÉCESSAIRES

**3 corrections CRITIQUES pour que le frontend fonctionne :**

1. **Renommer la colonne** : `application_drafts.cover_letter_content` → `cover_letter_text`
2. **Renommer la colonne** : `job_offers.description` → `raw_description`
3. **Ajouter colonnes** : `application_drafts.email_subject` et `email_body`

**Code migration complet :**
```python
def upgrade():
    # 1. Renommer colonnes
    op.alter_column('application_drafts', 'cover_letter_content',
                    new_column_name='cover_letter_text')
    op.alter_column('job_offers', 'description',
                    new_column_name='raw_description')
    
    # 2. Ajouter champs email dans drafts
    op.add_column('application_drafts', sa.Column('email_subject', sa.String(), nullable=True))
    op.add_column('application_drafts', sa.Column('email_body', sa.Text(), nullable=True))
    
    # 3. Ajouter champs JobOffer (optionnel mais recommandé)
    op.add_column('job_offers', sa.Column('source', sa.String(), nullable=True))
    op.add_column('job_offers', sa.Column('application_type', sa.String(), nullable=True))
    op.add_column('job_offers', sa.Column('application_url', sa.String(), nullable=True))
    
    # 4. Ajouter template User (optionnel)
    op.add_column('users', sa.Column('cover_letter_template', sa.Text(), nullable=True))
```

---

**Frontend est prêt à 100% dès que ces corrections sont faites ! 🚀**
