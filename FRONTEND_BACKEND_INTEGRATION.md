# 📋 Guide d'Intégration Frontend ↔ Backend - ApplyFlow

**Date:** 5 décembre 2025  
**Frontend:** React + TypeScript + Vite + TailwindCSS  
**Backend:** FastAPI + PostgreSQL + JWT Auth

---

## 🔐 1. AUTHENTIFICATION

### Endpoints Requis

#### `POST /api/v1/auth/login`
**Format requis:** `application/x-www-form-urlencoded` (OAuth2PasswordRequestForm)

```python
# Backend FastAPI
from fastapi.security import OAuth2PasswordRequestForm

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # form_data.username contient l'email
    # form_data.password contient le mot de passe
    user = authenticate(form_data.username, form_data.password)
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}
```

**Frontend envoie:**
```typescript
const formData = new URLSearchParams();
formData.append('username', email);  // ⚠️ Champ "username" même si c'est un email
formData.append('password', password);

// Headers
Content-Type: application/x-www-form-urlencoded
```

#### `POST /api/v1/auth/register`
**Format:** JSON

```python
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

@router.post("/auth/register")
def register(data: RegisterRequest):
    user = create_user(data)
    return user
```

**Frontend envoie:**
```json
{
  "email": "user@example.com",
  "password": "securepass",
  "name": "John Doe"
}
```

---

## 👤 2. UTILISATEURS

### `GET /api/v1/users/me`
**Authentification:** Required (JWT Bearer Token)

```python
@router.get("/users/me")
def get_current_user(current_user: User = Depends(get_current_user)):
    return current_user
```

**Réponse attendue:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "cv_path": "/uploads/cv/1_cv.pdf",
  "cover_letter_template": "Madame, Monsieur...",
  "created_at": "2025-12-05T10:00:00",
  "updated_at": "2025-12-05T10:00:00"
}
```

### `PUT /api/v1/users/me`
**Authentification:** Required

```python
class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    cv_path: Optional[str] = None
    cover_letter_template: Optional[str] = None

@router.put("/users/me")
def update_user(data: UpdateUserRequest, current_user: User = Depends(get_current_user)):
    # Mettre à jour seulement les champs fournis
    return updated_user
```

### `POST /api/v1/users/upload-cv`
**Authentification:** Required  
**Format:** `multipart/form-data`

```python
from fastapi import UploadFile, File

@router.post("/users/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Vérifier que c'est un PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files allowed")
    
    # Sauvegarder
    file_path = f"uploads/cv/{current_user.id}_{file.filename}"
    os.makedirs("uploads/cv", exist_ok=True)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Mettre à jour user
    current_user.cv_path = file_path
    db.commit()
    
    return {"file_path": file_path}
```

**Frontend envoie:**
```typescript
const formData = new FormData();
formData.append('file', pdfFile);

// Headers automatiques pour multipart/form-data
```

### `POST /api/v1/users/change-password`
**Authentification:** Required

```python
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/users/change-password")
def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user)):
    # Vérifier current_password
    # Hasher et sauvegarder new_password
    return {"message": "Password changed"}
```

---

## 💼 3. OFFRES D'EMPLOI (Job Offers)

### `GET /api/v1/job-offers/`
**Authentification:** Required  
**Filtrage:** Par user_id automatique (via JWT)

```python
@router.get("/job-offers/")
def get_job_offers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ⚠️ IMPORTANT: Filtrer par user_id
    offers = db.query(JobOffer).filter(
        JobOffer.user_id == current_user.id
    ).all()
    return offers
```

**Réponse:**
```json
[
  {
    "id": 1,
    "title": "Développeur Full Stack",
    "company": "TechCorp",
    "location": "Paris, France",
    "source": "LinkedIn",
    "url": "https://linkedin.com/jobs/123",
    "application_type": "portal",
    "application_url": "https://apply.techcorp.com",
    "raw_description": "Nous recherchons...",
    "created_at": "2025-12-05T10:00:00",
    "updated_at": "2025-12-05T10:00:00"
  }
]
```

### `POST /api/v1/job-offers/`
**Authentification:** Required

```python
class CreateJobOfferRequest(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    source: str
    url: Optional[str] = None
    application_type: Literal["email", "portal", "manual"]
    application_url: Optional[str] = None
    raw_description: str

@router.post("/job-offers/")
def create_job_offer(
    data: CreateJobOfferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = JobOffer(
        **data.dict(),
        user_id=current_user.id  # ⚠️ Lier à l'utilisateur
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer
```

**Frontend envoie:**
```json
{
  "title": "Développeur Full Stack",
  "company": "TechCorp",
  "location": "Paris, France",
  "source": "LinkedIn",
  "url": "https://linkedin.com/jobs/123",
  "application_type": "portal",
  "application_url": "https://apply.techcorp.com",
  "raw_description": "Nous recherchons un développeur..."
}
```

### `GET /api/v1/job-offers/{id}`
**Authentification:** Required

```python
@router.get("/job-offers/{id}")
def get_job_offer(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(JobOffer).filter(
        JobOffer.id == id,
        JobOffer.user_id == current_user.id  # ⚠️ Vérifier propriété
    ).first()
    
    if not offer:
        raise HTTPException(404, "Job offer not found")
    
    return offer
```

### `PUT /api/v1/job-offers/{id}`
### `DELETE /api/v1/job-offers/{id}`
Même logique avec vérification `user_id`

---

## 🎯 4. ANALYSE DE MATCH (Job Matches)

### `POST /api/v1/job-matches/analyze/{job_offer_id}`
**Authentification:** Required  
**⚠️ NOUVEAU COMPORTEMENT:**

```python
@router.post("/job-matches/analyze/{job_offer_id}")
def analyze_match(
    job_offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Récupérer l'offre
    offer = db.query(JobOffer).filter(
        JobOffer.id == job_offer_id,
        JobOffer.user_id == current_user.id
    ).first()
    
    if not offer:
        raise HTTPException(404, "Job offer not found")
    
    # ⚠️ IMPORTANT: Utiliser le CV de l'utilisateur
    if not current_user.cv_path:
        # Optionnel: utiliser profil générique ou retourner erreur
        # Le frontend gère déjà l'avertissement
        pass
    
    # Extraire le profil du CV (si uploadé)
    candidate_profile = parse_cv(current_user.cv_path) if current_user.cv_path else DEFAULT_PROFILE
    
    # Appeler l'IA pour analyser
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
    db.refresh(match)
    
    return match
```

**Réponse:**
```json
{
  "id": 1,
  "job_offer_id": 1,
  "score": 85,
  "reasons": "Excellente correspondance avec vos compétences en React et TypeScript...",
  "skills_detected": "React, TypeScript, Node.js, PostgreSQL",
  "red_flags": "Salaire non mentionné",
  "created_at": "2025-12-05T10:00:00"
}
```

### `GET /api/v1/job-matches/{job_offer_id}`
Retourner le dernier match pour cette offre

---

## ✉️ 5. BROUILLONS (Drafts)

### `POST /api/v1/drafts/{job_offer_id}`
**Authentification:** Required

```python
@router.post("/drafts/{job_offer_id}")
def generate_draft(
    job_offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(JobOffer).filter(
        JobOffer.id == job_offer_id,
        JobOffer.user_id == current_user.id
    ).first()
    
    if not offer:
        raise HTTPException(404, "Job offer not found")
    
    # ⚠️ VÉRIFIER CV
    if not current_user.cv_path:
        raise HTTPException(
            400, 
            detail="You must upload your CV before generating a cover letter"
        )
    
    # Extraire profil du CV
    profile = parse_cv(current_user.cv_path)
    
    # Utiliser le template de l'utilisateur si disponible
    template = current_user.cover_letter_template or DEFAULT_TEMPLATE
    
    # Générer avec IA
    ai_result = ai_generate_cover_letter(
        job_description=offer.raw_description,
        candidate_profile=profile,
        template=template,
        company=offer.company,
        position=offer.title
    )
    
    # Sauvegarder
    draft = ApplicationDraft(
        job_offer_id=job_offer_id,
        cover_letter_text=ai_result["cover_letter"],
        email_subject=ai_result["email_subject"],
        email_body=ai_result["email_body"],
        status="draft"
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    
    return draft
```

**Réponse:**
```json
{
  "id": 1,
  "job_offer_id": 1,
  "cover_letter_text": "Madame, Monsieur,\n\nJe me permets...",
  "cover_letter_pdf_path": null,
  "email_subject": "Candidature au poste de Développeur Full Stack",
  "email_body": "Bonjour,\n\nVeuillez trouver ci-joint...",
  "attachments": null,
  "status": "draft",
  "created_at": "2025-12-05T10:00:00",
  "updated_at": "2025-12-05T10:00:00"
}
```

### `GET /api/v1/drafts/{job_offer_id}`
Retourner le brouillon pour cette offre

### `PUT /api/v1/drafts/{draft_id}`
**Authentification:** Required

```python
class UpdateDraftRequest(BaseModel):
    cover_letter_text: Optional[str] = None
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    status: Optional[Literal["draft", "ready", "sent"]] = None

@router.put("/drafts/{draft_id}")
def update_draft(draft_id: int, data: UpdateDraftRequest, ...):
    # Mettre à jour
    return updated_draft
```

### `POST /api/v1/drafts/{draft_id}/send`
**Authentification:** Required

```python
@router.post("/drafts/{draft_id}/send")
def send_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    draft = db.query(ApplicationDraft).filter(
        ApplicationDraft.id == draft_id
    ).first()
    
    if not draft:
        raise HTTPException(404, "Draft not found")
    
    # Créer une application
    application = Application(
        job_offer_id=draft.job_offer_id,
        channel="email",  # ou déterminer depuis l'offre
        submitted_by="user",
        status="pending",
        sent_at=datetime.utcnow()
    )
    db.add(application)
    
    # Marquer le draft comme envoyé
    draft.status = "sent"
    
    db.commit()
    
    # Optionnel: envoyer vraiment l'email
    # send_email(draft.email_body, draft.email_subject, ...)
    
    return {"message": "Application sent successfully"}
```

---

## 📝 6. CANDIDATURES (Applications)

### `GET /api/v1/applications/`
**Authentification:** Required  
**Filtrage:** Par user_id automatique

```python
@router.get("/applications/")
def get_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ⚠️ Filtrer par les offres de l'utilisateur
    applications = db.query(Application).join(
        JobOffer, Application.job_offer_id == JobOffer.id
    ).filter(
        JobOffer.user_id == current_user.id
    ).all()
    
    return applications
```

### `GET /api/v1/applications/{id}`
### `POST /api/v1/applications/`
### `PUT /api/v1/applications/{id}`

Même logique avec vérification via `job_offer.user_id`

---

## 📅 7. TIMELINE

### `GET /api/v1/timeline/{application_id}`
```python
@router.get("/timeline/{application_id}")
def get_timeline(application_id: int, ...):
    events = db.query(TimelineEvent).filter(
        TimelineEvent.application_id == application_id
    ).order_by(TimelineEvent.event_date.desc()).all()
    
    return events
```

### `POST /api/v1/timeline/`
```python
class CreateTimelineEventRequest(BaseModel):
    application_id: int
    event_type: str
    description: str
    event_date: str

@router.post("/timeline/")
def create_timeline_event(data: CreateTimelineEventRequest, ...):
    event = TimelineEvent(**data.dict())
    db.add(event)
    db.commit()
    return event
```

---

## 🔒 8. MIDDLEWARE ET SÉCURITÉ

### CORS Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### JWT Authentication
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    
    return user
```

---

## 📊 9. MODÈLES DE BASE DE DONNÉES

### User
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    cv_path = Column(String, nullable=True)  # ✅ NOUVEAU
    cover_letter_template = Column(Text, nullable=True)  # ✅ NOUVEAU
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### JobOffer
```python
class JobOffer(Base):
    __tablename__ = "job_offers"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # ⚠️ IMPORTANT
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=True)
    source = Column(String, nullable=False)
    url = Column(String, nullable=True)
    application_type = Column(String, nullable=False)  # email, portal, manual
    application_url = Column(String, nullable=True)
    raw_description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## ✅ 10. CHECKLIST BACKEND

- [ ] CORS configuré pour localhost:5173 et localhost:5174
- [ ] JWT authentication fonctionnel
- [ ] `POST /auth/login` accepte form-data avec champ "username"
- [ ] `POST /auth/register` accepte JSON
- [ ] `GET /users/me` retourne user avec cv_path et cover_letter_template
- [ ] `POST /users/upload-cv` accepte multipart/form-data
- [ ] `GET /job-offers/` filtre par current_user.id
- [ ] `POST /job-offers/` lie automatiquement à current_user.id
- [ ] `POST /job-matches/analyze/{id}` utilise le CV de l'utilisateur
- [ ] `POST /drafts/{id}` vérifie que CV est uploadé (erreur 400 sinon)
- [ ] `POST /drafts/{id}/send` crée une Application
- [ ] `GET /applications/` filtre par user_id via job_offers
- [ ] Toutes les erreurs 401 redirigent vers /login (frontend gère)
- [ ] Les erreurs 400 retournent `{"detail": "message explicite"}`

---

## 🧪 11. TESTS DE COMMUNICATION

### Test 1: Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=test123"
```

### Test 2: Get User
```bash
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Create Job Offer
```bash
curl -X POST http://localhost:8000/api/v1/job-offers/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "company": "TestCorp",
    "source": "Manual",
    "application_type": "email",
    "raw_description": "Test description"
  }'
```

---

## 🚀 12. DÉMARRAGE

### Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

---

## 📞 SUPPORT

Si un endpoint ne fonctionne pas :
1. Vérifier les logs backend
2. Vérifier la console browser (F12)
3. Vérifier que le token JWT est envoyé
4. Vérifier le format des données (JSON vs form-data)
5. Vérifier CORS

---

**Frontend prêt à 100% ✅**  
**En attente de mise à jour backend selon ce guide** 🔄
