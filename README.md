# ApplyFlow Frontend

Application frontend professionnelle pour la gestion intelligente de candidatures d'emploi.

## 🚀 Technologies

- **React 19** avec TypeScript
- **Vite** pour le build ultra-rapide
- **TailwindCSS** pour le styling
- **shadcn/ui** pour les composants UI
- **Framer Motion** pour les animations
- **React Router** pour la navigation
- **TanStack Query (React Query)** pour la gestion des données
- **Zustand** pour l'état global
- **Axios** pour les requêtes HTTP
- **PWA** ready (Progressive Web App)

## 📁 Architecture

```
src/
├── app/
│   ├── layout/          # Composants de layout (AppShell, Sidebar, Topbar)
│   ├── providers/       # Providers React (Query, Theme)
│   └── router/          # Configuration du routing
├── features/            # Fonctionnalités par domaine
│   ├── auth/
│   │   ├── api/        # Appels API
│   │   ├── hooks/      # React Query hooks
│   │   ├── pages/      # Pages (Login, Register)
│   │   └── types.ts    # Types TypeScript
│   ├── users/
│   ├── jobOffers/
│   ├── jobMatches/
│   ├── drafts/
│   ├── applications/
│   ├── timeline/
│   ├── dashboard/
│   └── settings/
├── shared/
│   ├── components/      # Composants UI réutilisables
│   ├── lib/            # Utilitaires (API client, helpers)
│   └── types/          # Types partagés
└── styles/             # Styles globaux
```

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Créer le fichier .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local
```

## 🏃 Développement

```bash
# Lancer le serveur de développement
npm run dev

# L'application sera disponible sur http://localhost:5173
```

## 🏗️ Build

```bash
# Build pour la production
npm run build

# Prévisualiser le build
npm run preview
```

## 🎨 Fonctionnalités

### Authentification
- Connexion / Inscription
- Gestion de session avec JWT
- Routes protégées

### Dashboard
- Vue d'ensemble des statistiques
- KPIs (offres, candidatures, statuts)
- Candidatures récentes

### Gestion des offres d'emploi
- Lister toutes les offres
- Créer / Modifier / Supprimer des offres
- Détails d'une offre
- Recherche et filtres

### Analyse IA
- Score de correspondance avec l'IA
- Compétences détectées
- Points d'attention

### Génération de documents
- Génération automatique de lettres de motivation
- Personnalisation des emails
- Templates intelligents

### Suivi des candidatures
- Liste et filtres de candidatures
- Timeline des événements
- Gestion des relances

### Profil utilisateur
- Modification des informations
- Changement de mot de passe

## 🎨 Design System

L'application utilise un design system basé sur **shadcn/ui** avec :

- Mode clair / sombre
- Composants accessibles
- Animations fluides avec Framer Motion
- Design responsive (mobile-first)

## 📱 PWA

L'application est installable en tant que PWA :

- Fonctionne hors ligne (cache de base)
- Icônes pour l'écran d'accueil
- Manifest configuré
- Service Worker actif

## 🔧 Configuration

### Variables d'environnement

```env
VITE_API_URL=http://localhost:8000
```

---

**Développé avec ❤️ pour une expérience de recherche d'emploi optimale**
```
