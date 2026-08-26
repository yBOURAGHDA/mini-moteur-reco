/**
 * Vue "Découvrir" — page d'accueil.
 *
 * Charge les films depuis TMDB, les filtre (fonctionnalité 1) et les classe
 * par score de recommandation (fonctionnalité 2).
 *
 * Points d'accroche prévus pour la phase 2 :
 *   #filters-slot  -> fonctionnalité 1 (filtrage multi-critères)
 *   #weights-slot  -> fonctionnalité 3 (pondération configurable)
 *   #actions-slot  -> fonctionnalité 8 (bouton "Surprise Me")
 *   movieCard(..., { score, reasons, actions }) -> fonctionnalités 2, 4, 5, 6
 */

import { discoverMovies, TmdbError } from '../api/tmdb.js';
import { getState, resetFilters, setState, subscribe } from '../core/store.js';
import { rankMovies } from '../core/scoring.js';
import { hasActiveFilters, mountFilters } from '../ui/filters.js';
import { movieGrid } from '../ui/movieCard.js';
import { emptyState, errorState, loadingState } from '../ui/dom.js';

export async function homeView(_params, container) {
  container.innerHTML = `
    <div class="container">
      <section class="hero">
        <h1 class="hero__title">Trouvez le film qui vous correspond</h1>
        <p class="hero__text">
          Un moteur de recommandation qui explique ses choix, à partir des données TMDB.
        </p>
      </section>

      <!-- Fonctionnalité 1 : filtres multi-critères -->
      <section class="panel" id="filters-slot"></section>

      <!-- Fonctionnalité 3 : sliders de pondération -->
      <section class="panel" id="weights-slot"></section>

      <!-- Fonctionnalité 8 : bouton Surprise Me -->
      <section class="toolbar" id="actions-slot"></section>

      <section class="results" id="results">
        ${loadingState()}
      </section>

      <div class="pagination" id="pagination" hidden>
        <button class="btn btn--ghost" id="prev-page" type="button">← Précédent</button>
        <span class="pagination__info" id="page-info"></span>
        <button class="btn btn--ghost" id="next-page" type="button">Suivant →</button>
      </div>
    </div>`;

  const results = container.querySelector('#results');
  const pagination = container.querySelector('#pagination');
  const pageInfo = container.querySelector('#page-info');
  const prevButton = container.querySelector('#prev-page');
  const nextButton = container.querySelector('#next-page');

  prevButton.addEventListener('click', () => changePage(-1));
  nextButton.addEventListener('click', () => changePage(1));

  // Fonctionnalité 1 : le panneau de filtres relance la recherche à chaque
  // changement. La remise à la page 1 est gérée par `setFilters()`.
  const unmountFilters = mountFilters(container.querySelector('#filters-slot'), {
    onChange: loadMovies,
  });

  // Redessine la liste dès que l'état change (filtres, pondérations, favoris…).
  const unsubscribe = subscribe(render);

  await loadMovies();
  render(getState());

  return () => {
    unsubscribe();
    unmountFilters();
  };

  /* -------------------------------------------------------------- */

  async function loadMovies() {
    const { filters, page } = getState();
    setState({ loading: true, error: null });

    try {
      const { movies, totalPages } = await discoverMovies({
        page,
        genreId: filters.genreId,
        minYear: filters.minYear,
        minRating: filters.minRating,
        language: filters.language,
      });
      setState({ movies, totalPages, loading: false });
    } catch (error) {
      const message = error instanceof TmdbError
        ? error.message
        : 'Le chargement des films a échoué.';
      setState({ movies: [], loading: false, error: message });
    }
  }

  function render(state) {
    if (state.loading) {
      results.innerHTML = loadingState();
      pagination.hidden = true;
      return;
    }

    if (state.error) {
      results.innerHTML = errorState(state.error, 'Réessayer');
      results.querySelector('#state-retry')?.addEventListener('click', loadMovies);
      pagination.hidden = true;
      return;
    }

    if (state.movies.length === 0) {
      // Cas prévu par la fonctionnalité 1 : une combinaison de filtres trop
      // stricte ne renvoie rien. On propose directement la sortie de secours
      // plutôt que de laisser l'utilisateur devant une page vide.
      const filtered = hasActiveFilters(state.filters);

      results.innerHTML = emptyState(
        'Aucun film ne correspond',
        filtered
          ? 'Vos critères sont peut-être trop stricts. Essayez d\'en assouplir un.'
          : 'TMDB n\'a renvoyé aucun résultat pour cette page.',
        filtered
          ? '<button class="btn btn--primary" id="empty-reset" type="button">Réinitialiser les filtres</button>'
          : '',
      );

      results.querySelector('#empty-reset')?.addEventListener('click', async () => {
        resetFilters();
        await loadMovies();
      });

      pagination.hidden = true;
      return;
    }

    // Fonctionnalité 2 : les films sont classés par score, pas par l'ordre
    // renvoyé par TMDB. Le calcul vit dans core/scoring.js — une vue ne porte
    // pas de logique métier.
    const scoredMovies = rankMovies(state.movies, state.weights);

    results.innerHTML = movieGrid(scoredMovies, (movie) => ({ score: movie.score }));

    pagination.hidden = false;
    pageInfo.textContent = `Page ${state.page} sur ${state.totalPages}`;
    prevButton.disabled = state.page <= 1;
    nextButton.disabled = state.page >= state.totalPages;
  }

  async function changePage(delta) {
    const { page, totalPages } = getState();
    const target = Math.min(Math.max(page + delta, 1), totalPages);
    if (target === page) return;

    setState({ page: target });
    await loadMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
