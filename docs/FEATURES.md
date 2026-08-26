# Les 9 fonctionnalités

Chaque développeur en réalise **3**, avec un **outil IA différent à chaque fois**.
Une branche par fonctionnalité, une Pull Request par branche.

## Répartition

> Tableau à ajuster entre vous avant de commencer. Règle à respecter :
> aucun développeur ne réutilise deux fois le même outil.

| N° | Fonctionnalité | Développeur | Outil IA | Branche | Statut |
|:--:|---|---|---|---|:--:|
| 1 | Filtrage multi-critères | Dev 1 | GitHub Copilot | `feature/1-filtres-multicriteres` | ⏳ |
| 2 | Système de scoring | Dev 1 | Claude Code | `feature/2-scoring` | ⏳ |
| 5 | Explication du score | Dev 1 | ChatGPT | `feature/5-explication-score` | ⏳ |
| 3 | Pondération configurable | Dev 2 | Cursor | `feature/3-ponderation` | ⏳ |
| 4 | Favoris persistants | Dev 2 | GitHub Copilot | `feature/4-favoris` | ⏳ |
| 6 | Comparateur de films | Dev 2 | Claude Code | `feature/6-comparateur` | ⏳ |
| 7 | Recommandation par film | — | — | `feature/7-similaires` | bonus |
| 8 | Mode « Surprise Me » | — | — | `feature/8-surprise-me` | bonus |
| 9 | Dashboard statistiques | — | — | `feature/9-dashboard` | bonus |

### Ordre de merge conseillé

La fonctionnalité **2 (scoring)** est la brique dont dépendent les
fonctionnalités **3** et **5**. Mergez-la dans `develop` en premier, sinon les
deux autres travailleront sur une base qui n'existe pas encore.

Toutes les autres sont réellement indépendantes et peuvent avancer en parallèle.

---

## Détail des fonctionnalités

### 1 — Filtrage multi-critères avancé

Filtrer les films par **genre**, **année minimum**, **note minimum** et **langue**,
avec plusieurs critères combinables simultanément et une mise à jour immédiate
sans rechargement de page.

- **Où :** conteneur `#filters-slot` dans `src/js/views/home.js`
- **Ce qui existe déjà :** `discoverMovies()` accepte déjà `genreId`, `minYear`,
  `minRating` et `language` ; `state.filters` et `setFilters()` sont en place ;
  la liste des genres est chargée au démarrage dans `state.genres`
- **À traiter :** le cas où aucun film ne correspond, et la réinitialisation des
  filtres

### 2 — Système de scoring personnalisé

Attribuer à chaque film un score unique combinant **note moyenne**, **popularité**,
**récence** et **nombre de votes**, puis trier la liste selon ce score.

- **Où :** créer `src/js/core/scoring.js`, l'utiliser dans `home.js`
- **Contrat suggéré :** `computeScore(movie, weights) -> number` (fonction pure)
- **Point clé :** ces quatre données n'ont pas la même échelle. La note va de 0 à
  10, la popularité n'a pas de maximum, le nombre de votes se compte en milliers.
  Il faut **normaliser** avant de pondérer, sinon la popularité écrase tout le reste.
- **Affichage :** `movieCard(movie, { score })` affiche déjà un badge de score

### 3 — Pondération configurable par l'utilisateur

Des sliders permettent de donner plus d'importance à la popularité, à la note ou
à la récence. Le classement se recalcule immédiatement.

- **Où :** conteneur `#weights-slot` dans `src/js/views/home.js`
- **Ce qui existe déjà :** `state.weights`, `setWeights()` et `DEFAULT_WEIGHTS`
  dans le store ; toute vue abonnée se redessine automatiquement
- **Dépend de :** fonctionnalité 2

### 4 — Système de favoris persistants

Ajouter un film en favori, le stocker en `localStorage`, et le retrouver après
rechargement dans une page « Mes recommandations ».

- **Où :** `src/js/views/favorites.js` + bouton dans `movieCard(..., { actions })`
- **Ce qui existe déjà :** `state.favorites` (tableau d'identifiants), la route
  `#/favorites` et le lien de navigation
- **À traiter :** l'ajout, la suppression, l'absence de doublon, la synchronisation
  entre le stockage et l'interface

### 5 — Explication du score (transparence)

Afficher sous chaque film la raison de sa recommandation :
« Recommandé car : ✔ note élevée ✔ film récent ✔ correspond à vos genres favoris ».

- **Où :** `movieCard(movie, { reasons })` et `#reasons-slot` dans la vue détail
- **Principe :** analyser quels critères ont le plus contribué au score, et
  générer une justification lisible — pas une simple liste de tous les critères
- **Dépend de :** fonctionnalité 2

### 6 — Comparateur de films

Sélectionner deux films et afficher un tableau comparatif (note, popularité,
date de sortie, nombre de votes).

- **Où :** `src/js/views/compare.js` + case à cocher dans `movieCard(..., { actions })`
- **Ce qui existe déjà :** `state.comparison` (tableau d'identifiants), la route
  `#/compare`
- **À traiter :** la désélection, et le cas où moins de deux films sont choisis

### 7 — Recommandation basée sur un film choisi

Depuis la fiche d'un film, proposer des films similaires.

- **Où :** conteneur `#similar-slot` dans `src/js/views/movie.js`
- **Ce qui existe déjà :** `fetchSimilarMovies(id)` dans le client TMDB, et
  `movieGrid()` pour l'affichage

### 8 — Mode « Surprise Me »

Un bouton qui tire un film au hasard **parmi ceux qui respectent les filtres
actifs**, et non dans tout le catalogue.

- **Où :** conteneur `#actions-slot` dans `src/js/views/home.js`
- **À traiter :** liste vide, liste très courte, et navigation vers la fiche du
  film tiré (`navigate('/movie/' + id)`)

### 9 — Dashboard statistiques

Analyser les films actuellement chargés : note moyenne, film le plus populaire,
film le plus récent, répartition par genre sous forme de graphique simple.

- **Où :** `src/js/views/stats.js`
- **Ce qui existe déjà :** `state.movies` (films chargés), `genreName(id)` pour
  convertir un identifiant de genre en libellé
- **Piste :** un graphique en barres se fait très bien en CSS pur, sans librairie

---

## Pendant le développement : remplir la fiche d'observation

Pour chaque fonctionnalité, notez **à chaud** (pas à la fin de la journée) :

- le temps passé et le nombre de prompts ;
- si le code a fonctionné du premier coup ;
- ce que l'outil a bien fait, et ce qu'il a raté ;
- les prompts qui ont le mieux marché, mot pour mot ;
- **toute erreur subtile repérée en relisant le diff** — c'est la donnée la plus
  intéressante de la journée.
