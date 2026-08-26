# Convention Git du projet

## Les branches

| Branche | Rôle |
|---|---|
| `main` | Version stable, toujours fonctionnelle. On ne pousse jamais directement dessus. |
| `develop` | Branche d'intégration. Toutes les fonctionnalités y sont mergées. |
| `feature/<n>-<nom>` | Une branche par fonctionnalité, créée depuis `develop`. |

Nommage des branches de fonctionnalité, avec le numéro de la fonctionnalité
et l'outil IA utilisé :

```
feature/1-filtres-multicriteres
feature/2-scoring
feature/4-favoris
```

## Le cycle d'une fonctionnalité

```bash
# 1. Partir d'une develop à jour
git checkout develop
git pull origin develop

# 2. Créer sa branche
git checkout -b feature/1-filtres-multicriteres

# 3. Développer, en commitant régulièrement
git add .
git commit -m "feat(filtres): ajoute le filtre par genre"

# 4. Publier la branche
git push -u origin feature/1-filtres-multicriteres

# 5. Ouvrir une Pull Request vers develop sur GitHub
#    -> relue par l'autre développeur, puis mergée
```

## Messages de commit

Format [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<portée>): <description à l'impératif>
```

Types utilisés : `feat`, `fix`, `refactor`, `style`, `docs`, `chore`.

Exemples :

```
feat(scoring): calcule un score pondéré par film
fix(api): gère le cas d'une réponse TMDB vide
docs(readme): documente la configuration de la clé API
```

## Les Pull Requests

Chaque PR doit indiquer :

- **le numéro de la fonctionnalité** développée ;
- **l'outil IA utilisé** (ChatGPT / Copilot / Cursor / Claude Code) ;
- ce qui a été généré par l'IA et ce qui a été écrit ou corrigé à la main ;
- comment tester la fonctionnalité.

Modèle de description :

```markdown
## Fonctionnalité 1 — Filtrage multi-critères

**Outil IA utilisé :** Cursor (Agent Mode)

### Ce que fait cette PR
- Ajoute un panneau de filtres (genre, année, note, langue)
- Branche les filtres sur le store et relance la recherche TMDB

### Part de l'IA
- ~70 % du code généré, 30 % corrigé à la main
- L'IA avait oublié de gérer le cas « aucun résultat » : ajouté manuellement

### Comment tester
1. Lancer l'app, sélectionner le genre « Animation »
2. Mettre la note minimum à 8 → la liste doit se réduire
3. Combiner avec l'année 2020 → vérifier le message si la liste est vide
```

## Règles à respecter

1. **Une branche = une fonctionnalité.** Pas de mélange.
2. **Jamais de commit direct sur `main` ou `develop`.**
3. **Toujours relire le diff avant de valider** — surtout le code généré par
   une IA. C'est le point clé de l'exercice : une suggestion qui « a l'air
   juste » peut contenir une faille ou un cas limite non traité.
4. **Résoudre les conflits sur sa propre branche**, jamais dans la PR.
5. **Ne jamais commiter `src/js/config.js`** (votre clé API TMDB).
