/**
 * Fonctionnalité 1 — Filtrage multi-critères avancé.
 *
 * Panneau de filtres combinables : genre, année minimum, note minimum, langue.
 * Chaque changement met à jour le store puis déclenche un nouvel appel TMDB,
 * sans rechargement de page.
 *
 * Le module ne connaît pas la façon dont les films sont chargés : il reçoit un
 * callback `onChange`. C'est la vue qui décide quoi faire du changement.
 */

import { DEFAULT_FILTERS, getState, resetFilters, setFilters, subscribe } from '../core/store.js';
import { escapeHtml } from './dom.js';

/** Délai avant de lancer la requête quand l'utilisateur tape une année. */
const DEBOUNCE_MS = 450;

/** Langues originales les plus courantes sur TMDB. */
const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'es', label: 'Espagnol' },
  { code: 'it', label: 'Italien' },
  { code: 'de', label: 'Allemand' },
  { code: 'ja', label: 'Japonais' },
  { code: 'ko', label: 'Coréen' },
];

/** Paliers de note proposés. */
const RATINGS = [5, 6, 7, 8, 9];

const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear();

/**
 * Monte le panneau de filtres dans un conteneur.
 *
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {() => (void|Promise<void>)} options.onChange
 *        appelé après chaque modification de filtre
 * @returns {() => void} fonction de nettoyage
 */
export function mountFilters(container, { onChange }) {
  const { filters, genres } = getState();
  let debounceId = null;

  container.innerHTML = `
    <h2 class="filters__title">Affiner la recherche</h2>

    <div class="filters">
      <label class="field">
        <span class="field__label">Genre</span>
        <select class="field__select" id="filter-genre">
          <option value="">Tous les genres</option>
          ${genres
            .map((genre) => `
              <option value="${genre.id}" ${String(genre.id) === String(filters.genreId) ? 'selected' : ''}>
                ${escapeHtml(genre.name)}
              </option>`)
            .join('')}
        </select>
      </label>

      <label class="field">
        <span class="field__label">Année minimum</span>
        <input class="field__input" type="number" id="filter-year"
               min="${MIN_YEAR}" max="${MAX_YEAR}" step="1"
               placeholder="ex : 2015" value="${escapeHtml(filters.minYear)}">
      </label>

      <label class="field">
        <span class="field__label">Note minimum</span>
        <select class="field__select" id="filter-rating">
          <option value="">Toutes les notes</option>
          ${RATINGS
            .map((rating) => `
              <option value="${rating}" ${String(rating) === String(filters.minRating) ? 'selected' : ''}>
                ${rating} / 10 et plus
              </option>`)
            .join('')}
        </select>
      </label>

      <label class="field">
        <span class="field__label">Langue originale</span>
        <select class="field__select" id="filter-language">
          <option value="">Toutes les langues</option>
          ${LANGUAGES
            .map((language) => `
              <option value="${language.code}" ${language.code === filters.language ? 'selected' : ''}>
                ${escapeHtml(language.label)}
              </option>`)
            .join('')}
        </select>
      </label>

      <div class="filters__actions">
        <button class="btn btn--ghost" id="filter-reset" type="button">Réinitialiser</button>
      </div>
    </div>

    <p class="filters__summary" id="filter-summary"></p>`;

  const genreInput = container.querySelector('#filter-genre');
  const yearInput = container.querySelector('#filter-year');
  const ratingInput = container.querySelector('#filter-rating');
  const languageInput = container.querySelector('#filter-language');
  const resetButton = container.querySelector('#filter-reset');
  const summary = container.querySelector('#filter-summary');

  genreInput.addEventListener('change', () => apply({ genreId: genreInput.value }));
  ratingInput.addEventListener('change', () => apply({ minRating: ratingInput.value }));
  languageInput.addEventListener('change', () => apply({ language: languageInput.value }));

  // L'année se tape caractère par caractère : on attend la fin de la saisie
  // avant d'appeler TMDB, sinon « 2015 » déclenche quatre requêtes.
  yearInput.addEventListener('input', () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      debounceId = null;
      apply({ minYear: readYear() });
    }, DEBOUNCE_MS);
  });

  resetButton.addEventListener('click', () => {
    clearTimeout(debounceId);
    debounceId = null;
    resetFilters();
    onChange();
  });

  // Les filtres peuvent aussi être réinitialisés depuis l'extérieur (bouton du
  // message « aucun film ne correspond »). On resynchronise alors les champs,
  // sinon ils continueraient d'afficher des critères qui ne s'appliquent plus.
  const unsubscribe = subscribe((state) => syncInputs(state.filters));

  updateSummary();

  return () => {
    clearTimeout(debounceId);
    unsubscribe();
  };

  /* -------------------------------------------------------------- */

  /**
   * Lit et valide l'année saisie.
   * Une année incomplète (« 20 ») ou hors bornes est ignorée plutôt que
   * d'être envoyée telle quelle à TMDB.
   * @returns {string}
   */
  function readYear() {
    const raw = yearInput.value.trim();
    if (raw === '') return '';

    const year = Number(raw);
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) return '';

    return String(year);
  }

  /**
   * Applique un changement de filtre puis relance la recherche.
   * @param {Object} patch
   */
  function apply(patch) {
    setFilters(patch);
    updateSummary();
    onChange();
  }

  /**
   * Aligne les champs sur l'état du store.
   *
   * Deux protections, sans lesquelles la saisie de l'utilisateur est effacée
   * sous ses doigts :
   *   - on ne touche jamais au champ qui a le focus ;
   *   - on ne touche pas au champ « année » tant qu'une saisie est en attente
   *     de debounce, car la valeur tapée n'est pas encore dans le store.
   *
   * @param {Object} filters
   */
  function syncInputs(filters) {
    const focused = document.activeElement;

    if (genreInput !== focused) genreInput.value = filters.genreId;
    if (ratingInput !== focused) ratingInput.value = filters.minRating;
    if (languageInput !== focused) languageInput.value = filters.language;
    if (yearInput !== focused && debounceId === null) yearInput.value = filters.minYear;

    updateSummary();
  }

  /** Affiche un récapitulatif lisible des filtres actifs. */
  function updateSummary() {
    const active = activeFilterLabels(getState());

    summary.textContent = active.length === 0
      ? 'Aucun filtre actif — tous les films populaires sont affichés.'
      : `Filtres actifs : ${active.join(' · ')}`;

    resetButton.disabled = active.length === 0;
  }
}

/**
 * Indique si au moins un filtre est actif.
 * @param {Object} filters
 * @returns {boolean}
 */
export function hasActiveFilters(filters) {
  return Object.keys(DEFAULT_FILTERS).some((key) => Boolean(filters[key]));
}

/**
 * Traduit les filtres actifs en libellés lisibles.
 * @param {Object} state
 * @returns {Array<string>}
 */
function activeFilterLabels({ filters, genres }) {
  const labels = [];

  if (filters.genreId) {
    const genre = genres.find((g) => String(g.id) === String(filters.genreId));
    labels.push(genre ? genre.name : 'genre sélectionné');
  }
  if (filters.minYear) labels.push(`à partir de ${filters.minYear}`);
  if (filters.minRating) labels.push(`note ≥ ${filters.minRating}/10`);
  if (filters.language) {
    const language = LANGUAGES.find((l) => l.code === filters.language);
    labels.push(language ? language.label : filters.language);
  }

  return labels;
}
