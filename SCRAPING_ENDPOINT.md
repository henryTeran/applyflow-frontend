# 🚀 Endpoint de Scraping d'Offres - Backend

## 📍 Endpoint: `POST /api/v1/job-offers/scrape`

**Authentification:** Required (JWT Bearer Token)

### Description
Cet endpoint extrait automatiquement les informations d'une offre d'emploi à partir de son URL.

---

## 📥 Requête

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Body
```json
{
  "url": "https://www.linkedin.com/jobs/view/123456789/"
}
```

---

## 📤 Réponse Attendue

### Status: 200 OK
```json
{
  "title": "Développeur Full Stack Senior",
  "company": "TechCorp France",
  "location": "Paris, Île-de-France, France",
  "description": "Nous recherchons un développeur Full Stack expérimenté...\n\nResponsabilités:\n- Développer des applications web...\n- Collaborer avec l'équipe...\n\nQualifications:\n- 5+ ans d'expérience...\n- Maîtrise de React, Node.js...",
  "application_type": "portal",
  "application_url": "https://www.linkedin.com/jobs/apply/123456789/"
}
```

### Champs Retournés

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `title` | string | ✅ | Titre du poste |
| `company` | string | ✅ | Nom de l'entreprise |
| `location` | string | ❌ | Localisation (ville, pays) |
| `description` | string | ✅ | Description complète de l'offre |
| `application_type` | string | ✅ | Type: "email", "portal", ou "manual" |
| `application_url` | string | ❌ | URL de candidature (si différente de l'URL de l'offre) |

---

## 🛠️ Implémentation Backend Suggérée

### Option 1: Scraping Direct (BeautifulSoup + Selenium)

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time

router = APIRouter()

class ScrapeRequest(BaseModel):
    url: HttpUrl

class ScrapeResponse(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    description: str
    application_type: Literal["email", "portal", "manual"]
    application_url: Optional[str] = None

@router.post("/job-offers/scrape", response_model=ScrapeResponse)
async def scrape_job_offer(
    data: ScrapeRequest,
    current_user: User = Depends(get_current_user)
):
    url = str(data.url)
    
    # Détecter la plateforme
    if "linkedin.com" in url:
        return scrape_linkedin(url)
    elif "indeed.com" in url or "indeed.fr" in url:
        return scrape_indeed(url)
    elif "welcometothejungle.com" in url:
        return scrape_wttj(url)
    else:
        # Scraping générique
        return scrape_generic(url)

def scrape_linkedin(url: str) -> ScrapeResponse:
    """Scrape une offre LinkedIn"""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        time.sleep(2)  # Attendre le chargement
        
        # Extraire les informations
        title = driver.find_element(By.CSS_SELECTOR, "h1.top-card-layout__title").text
        company = driver.find_element(By.CSS_SELECTOR, "a.topcard__org-name-link").text
        
        try:
            location = driver.find_element(By.CSS_SELECTOR, "span.topcard__flavor--bullet").text
        except:
            location = None
        
        # Description
        description_element = driver.find_element(By.CSS_SELECTOR, "div.show-more-less-html__markup")
        description = description_element.text
        
        # URL de candidature
        try:
            apply_button = driver.find_element(By.CSS_SELECTOR, "a.jobs-apply-button")
            application_url = apply_button.get_attribute("href")
        except:
            application_url = url
        
        return ScrapeResponse(
            title=title,
            company=company,
            location=location,
            description=description,
            application_type="portal",
            application_url=application_url
        )
    
    finally:
        driver.quit()

def scrape_indeed(url: str) -> ScrapeResponse:
    """Scrape une offre Indeed"""
    # Implémentation similaire pour Indeed
    pass

def scrape_wttj(url: str) -> ScrapeResponse:
    """Scrape une offre Welcome to the Jungle"""
    # Implémentation similaire pour WTTJ
    pass

def scrape_generic(url: str) -> ScrapeResponse:
    """Scraping générique pour sites inconnus"""
    import requests
    from bs4 import BeautifulSoup
    
    response = requests.get(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Tenter d'extraire les informations avec des sélecteurs génériques
    title = (
        soup.find('h1') or 
        soup.find(class_=lambda x: x and 'title' in x.lower())
    )
    
    # Si on ne trouve rien, retourner une erreur
    if not title:
        raise HTTPException(
            400, 
            detail="Unable to extract job information from this URL. Please enter the details manually."
        )
    
    return ScrapeResponse(
        title=title.text.strip(),
        company="Unknown",
        location=None,
        description=soup.get_text()[:1000],  # Limiter la longueur
        application_type="manual",
        application_url=url
    )
```

---

### Option 2: API Externe (Recommandé pour Production)

Si vous voulez une solution plus robuste et maintenance-free, utilisez une API de scraping externe :

#### **Scrapin.io** (Recommandé)
```python
import requests

def scrape_with_api(url: str) -> ScrapeResponse:
    api_url = "https://api.scrapin.io/enrichment/job"
    
    response = requests.post(
        api_url,
        json={"url": url},
        headers={"Authorization": f"Bearer {SCRAPIN_API_KEY}"}
    )
    
    data = response.json()
    
    return ScrapeResponse(
        title=data["title"],
        company=data["company"]["name"],
        location=data.get("location"),
        description=data["description"],
        application_type="portal",
        application_url=data.get("applyUrl", url)
    )
```

#### **Autres APIs:**
- **Apify** (https://apify.com/actors)
- **ScraperAPI** (https://www.scraperapi.com/)
- **BrightData** (https://brightdata.com/)

---

## 🚨 Gestion des Erreurs

### Erreur 400: URL invalide ou scraping impossible
```json
{
  "detail": "Unable to extract job information from this URL. Please enter the details manually."
}
```

**Frontend gère:** Affiche un message et redirige vers le formulaire manuel

### Erreur 429: Trop de requêtes
```json
{
  "detail": "Too many scraping requests. Please try again later."
}
```

### Erreur 503: Service indisponible
```json
{
  "detail": "Scraping service temporarily unavailable. Please try again later."
}
```

---

## 📦 Dépendances Python Requises

```bash
# Option 1: Scraping direct
pip install selenium beautifulsoup4 webdriver-manager

# Option 2: API externe
pip install requests

# Commun
pip install pydantic fastapi
```

### Configuration Selenium (Option 1)
```python
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)
```

---

## 🧪 Test Manuel

```bash
# Tester le scraping
curl -X POST http://localhost:8000/api/v1/job-offers/scrape \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.linkedin.com/jobs/view/123456789/"
  }'
```

**Réponse attendue:** JSON avec title, company, description, etc.

---

## 🎯 Workflow Frontend → Backend

1. **Frontend:** Utilisateur colle une URL dans QuickApplyPage
2. **Frontend:** Envoie `POST /job-offers/scrape` avec l'URL
3. **Backend:** Scrape l'URL et retourne les données structurées
4. **Frontend:** Crée automatiquement l'offre avec `POST /job-offers/`
5. **Frontend:** Lance l'analyse de match `POST /job-matches/analyze/{id}`
6. **Frontend:** Génère le brouillon `POST /drafts/{id}`
7. **Frontend:** Affiche pour review
8. **Frontend:** Envoie la candidature `POST /drafts/{id}/send`

---

## 💡 Améliorations Futures

### Phase 2: Parsing avec IA (GPT-4)
Au lieu de scraper avec sélecteurs CSS, utiliser GPT-4 pour extraire les données :

```python
import openai

def scrape_with_ai(url: str) -> ScrapeResponse:
    # Récupérer le HTML brut
    html = requests.get(url).text
    
    # Demander à GPT-4 d'extraire les informations
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{
            "role": "system",
            "content": "You are a job posting parser. Extract title, company, location, and description from HTML."
        }, {
            "role": "user",
            "content": f"Extract job info from:\n{html[:5000]}"
        }]
    )
    
    # Parser la réponse JSON de GPT-4
    data = json.loads(response.choices[0].message.content)
    
    return ScrapeResponse(**data)
```

**Avantages:**
- ✅ Fonctionne sur tous les sites
- ✅ Pas besoin de maintenir des sélecteurs CSS
- ✅ S'adapte automatiquement aux changements de structure

**Inconvénients:**
- ❌ Coût par requête (~$0.03-0.06)
- ❌ Plus lent (2-5 secondes)

---

## ✅ Checklist d'Implémentation

- [ ] Endpoint `POST /job-offers/scrape` créé
- [ ] Scraping LinkedIn fonctionnel
- [ ] Scraping Indeed fonctionnel (optionnel)
- [ ] Scraping générique comme fallback
- [ ] Gestion des erreurs 400 si scraping impossible
- [ ] Test avec plusieurs URLs
- [ ] Limiter le nombre de requêtes par utilisateur (rate limiting)
- [ ] Documentation API mise à jour

---

**Frontend prêt ✅**  
**Backend à implémenter selon ce guide** 🔄
