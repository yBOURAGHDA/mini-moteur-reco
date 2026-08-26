# CineScore — Mini moteur de recommandation

Application web qui recommande des films à partir des données de l'API
[TMDB](https://developer.themoviedb.org/docs/getting-started), avec un système
de scoring configurable par l'utilisateur.

Projet réalisé en binôme dans le cadre de la journée **Découverte IA** :
chaque développeur implémente 3 fonctionnalités, chacune avec un outil d'IA
différent (ChatGPT, GitHub Copilot, Cursor, Claude Code), afin de comparer
concrètement ces outils sur des tâches réelles.

---

## Démarrage rapide

### 1. Récupérer le projet

```bash
git clone <url-du-depot>
cd mini-moteur-reco
```

### 2. Obtenir une clé API TMDB

Créez un compte gratuit sur [themoviedb.org](https://www.themoviedb.org/signup),
puis récupérez votre clé dans **Paramètres → API → API Key (v3 auth)**.

Deux façons de la fournir, au choix :

- **Via l'interface** (le plus simple) : lancez l'application, elle vous
  demandera la clé au premier chargement et la conservera dans le `localStorage`.
- **Via un fichier local** : copiez `src/js/config.example.js` en
  `src/js/config.js` et collez-y votre clé. Ce fichier est dans le `.gitignore`,
  il ne partira jamais sur GitHub.

> ⚠️ Ne commitez jamais votre clé API. Si cela arrive, régénérez-la
> immédiatement depuis votre compte TMDB.

### 3. Lancer l'application

Le projet utilise les modules ES : il doit être servi par un serveur HTTP.
**Un double-clic sur `index.html` ne fonctionnera pas** (le navigateur bloque
les imports de modules sur `file://`).

Au choix, dans l'ordre du plus simple :

```bash
# 1. Avec VS Code : extension "Live Server", clic droit sur index.html
#    -> "Open with Live Server"

# 2. Avec Node
npm start

# 3. Avec Python (attention : sous Windows, `python` peut n'être qu'un
#    raccourci Microsoft Store non fonctionnel — vérifiez avec `python -V`)
python -m http.server 5173
```

Puis ouvrez <http://localhost:5173>.

### 4. Modifier les styles (SASS)

```bash
npm install
npm run sass:watch
```

Le CSS compilé (`src/css/main.css`) est commité volontairement, pour que le
projet reste lançable sans installer Node. **Après toute modification d'un
fichier `.scss`, recompilez et commitez les deux fichiers.**

---

## Architecture

```
mini-moteur-reco/
├── index.html                 Point d'entrée, structure de la page
├── package.json               Scripts SASS (optionnel)
├── docs/
│   ├── FEATURES.md            Les 9 fonctionnalités et leur répartition
│   └── GITFLOW.md             Convention de branches et de Pull Requests
└── src/
    ├── scss/                  Sources SASS
    ├── css/main.css           CSS compilé (généré, commité)
    └── js/
        ├── main.js            Amorçage : clé API → genres → routeur
        ├── config.example.js  Modèle de configuration locale
        ├── api/
        │   └── tmdb.js        Client TMDB (seul endroit qui fait des fetch)
        ├── core/
        │   ├── apiKey.js      Gestion de la clé API
        │   ├── router.js      Routeur par hash
        │   └── store.js       État global (publish/subscribe)
        ├── ui/
        │   ├── dom.js         Aides DOM, états de chargement/erreur
        │   └── movieCard.js   Composant carte de film
        └── views/
            ├── home.js        Découvrir (liste + pagination)
            ├── movie.js       Détail d'un film
            ├── favorites.js   ⏳ fonctionnalité 4
            ├── compare.js     ⏳ fonctionnalité 6
            └── stats.js       ⏳ fonctionnalité 9
```

### Trois règles d'architecture

1. **Aucune vue n'appelle `fetch` directement.** Tout passe par
   `src/js/api/tmdb.js`, qui renvoie des données déjà normalisées.
2. **Aucune vue ne modifie l'état directement.** On passe par `setState()` ou
   par une action du store. Les vues s'abonnent via `subscribe()` et se
   redessinent toutes seules.
3. **La logique métier vit hors des vues.** Le scoring, le filtrage et les
   statistiques sont des fonctions pures, testables et réutilisables.

Ces règles ne sont pas décoratives : elles permettent aux deux développeurs de
travailler en parallèle sur des fichiers différents, et donc de limiter les
conflits de merge.

### Points d'accroche prévus

Chaque vue contient des conteneurs vides prêts à recevoir les fonctionnalités
de la phase 2 :

| Emplacement | Fonctionnalité attendue |
|---|---|
| `#filters-slot` (accueil) | 1 — Filtrage multi-critères |
| `#weights-slot` (accueil) | 3 — Pondération configurable |
| `#actions-slot` (accueil) | 8 — Mode « Surprise Me » |
| `movieCard(movie, { score })` | 2 — Système de scoring |
| `movieCard(movie, { reasons })` | 5 — Explication du score |
| `movieCard(movie, { actions })` | 4 et 6 — Favoris, comparateur |
| `#similar-slot` (détail) | 7 — Films similaires |
| `views/favorites.js` | 4 — Favoris persistants |
| `views/compare.js` | 6 — Comparateur |
| `views/stats.js` | 9 — Dashboard statistiques |

---

## Ce qui est déjà fait (phase 1)

- [x] Structure HTML / SASS / JS
- [x] Client de l'API TMDB avec gestion des erreurs (401, 429, réseau)
- [x] Gestion de la clé API sans jamais la commiter
- [x] Récupération des films (`/discover/movie`) et pagination
- [x] Routeur par hash avec 5 vues
- [x] État global en publish/subscribe
- [x] Composant carte de film, extensible
- [x] États de chargement, d'erreur et de liste vide
- [x] Gitflow initialisé (`main` / `develop`)

## Ce qui reste à faire (phase 2)

Voir [`docs/FEATURES.md`](docs/FEATURES.md) pour le détail des 9 fonctionnalités
et la répartition entre les deux développeurs.

---

## Contribution

Le projet suit un **Gitflow simplifié** : voir [`docs/GITFLOW.md`](docs/GITFLOW.md).

En résumé : une branche par fonctionnalité, partant de `develop`, et une Pull
Request obligatoire relue par l'autre développeur avant le merge.

---

## Crédits

Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
