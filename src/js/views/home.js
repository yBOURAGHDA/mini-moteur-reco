/**
 * Vue "Découvrir" — page d'accueil.
 *
 * Rôle en phase 1 : charger des films depuis TMDB et les afficher.
 * Le tri est celui de l'API (popularité décroissante) tant que la
 * fonctionnalité 2 (scoring) n'est pas développée.
 *
 * Points d'accroche prévus pour la phase 2 :
 *   #filters-slot  -> fonctionnalité 1 (filtrage multi-critères)
 *   #weights-slot  -> fonctionnalité 3 (pondération configurable)
 *   #actions-slot  -> fonctionnalité 8 (bouton "Surprise Me")
 *   movieCard(..., { score, reasons, actions }) -> fonctionnalités 2, 4, 5, 6
 */

import { discoverMovies, TmdbError } from '../api/tmdb.js';
import { getState, setState, subscribe } from '../core/store.js';
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

  // Redessine la liste dès que l'état change (filtres, pondérations, favoris…).
  const unsubscribe = subscribe(render);

  await loadMovies();
  render(getState());

  return () => unsubscribe();

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
      results.innerHTML = emptyState(
        'Aucun film ne correspond',
        'Essayez d\'assouplir vos critères de recherche.',
      );
      pagination.hidden = true;
      return;
    }

    results.innerHTML = movieGrid(state.movies);

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
