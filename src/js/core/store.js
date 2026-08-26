/**
 * État global de l'application.
 *
 * Un store minimaliste en publish/subscribe : les vues s'abonnent aux
 * changements et se redessinent, elles ne se parlent jamais entre elles.
 *
 * C'est le point d'accroche prévu pour la plupart des fonctionnalités :
 *   - filtres (fonctionnalité 1)     -> state.filters
 *   - pondérations (fonctionnalité 3) -> state.weights
 *   - favoris (fonctionnalité 4)      -> state.favorites
 *   - comparateur (fonctionnalité 6)  -> state.comparison
 *
 * Règle d'or : on ne modifie jamais `state` directement depuis une vue,
 * on passe toujours par `setState()` ou par une action dédiée.
 */

/** Valeurs par défaut des filtres. */
export const DEFAULT_FILTERS = {
  genreId: '',
  minYear: '',
  minRating: '',
  language: '',
};

/**
 * Pondérations par défaut du score (fonctionnalité 2).
 * La somme n'a pas besoin de valoir 1 : le calcul normalise.
 */
export const DEFAULT_WEIGHTS = {
  rating: 0.4,
  popularity: 0.3,
  recency: 0.2,
  voteCount: 0.1,
};

const state = {
  /** @type {Array} films actuellement chargés (déjà normalisés) */
  movies: [],
  /** @type {Array<{id:number,name:string}>} */
  genres: [],
  /** @type {typeof DEFAULT_FILTERS} */
  filters: { ...DEFAULT_FILTERS },
  /** @type {typeof DEFAULT_WEIGHTS} */
  weights: { ...DEFAULT_WEIGHTS },
  /** @type {Array<number>} identifiants des films favoris */
  favorites: [],
  /** @type {Array<number>} identifiants sélectionnés pour le comparateur */
  comparison: [],
  /** @type {boolean} */
  loading: false,
  /** @type {string|null} */
  error: null,
  /** @type {number} */
  page: 1,
  /** @type {number} */
  totalPages: 1,
};

const listeners = new Set();

/**
 * Lecture de l'état. On retourne une copie de surface pour éviter les
 * mutations accidentelles depuis les vues.
 * @returns {typeof state}
 */
export function getState() {
  return { ...state };
}

/**
 * Met à jour l'état et notifie les abonnés.
 * @param {Partial<typeof state>} patch
 */
export function setState(patch) {
  Object.assign(state, patch);
  notify();
}

/**
 * S'abonne aux changements d'état.
 * @param {(state: typeof state) => void} listener
 * @returns {() => void} fonction de désabonnement
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  const snapshot = getState();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

/**
 * Met à jour un ou plusieurs filtres.
 * @param {Partial<typeof DEFAULT_FILTERS>} patch
 */
export function setFilters(patch) {
  setState({ filters: { ...state.filters, ...patch }, page: 1 });
}

/** Réinitialise tous les filtres. */
export function resetFilters() {
  setState({ filters: { ...DEFAULT_FILTERS }, page: 1 });
}

/**
 * Met à jour une ou plusieurs pondérations du score.
 * @param {Partial<typeof DEFAULT_WEIGHTS>} patch
 */
export function setWeights(patch) {
  setState({ weights: { ...state.weights, ...patch } });
}

/**
 * Retrouve un film déjà chargé par son identifiant.
 * @param {number|string} id
 * @returns {Object|undefined}
 */
export function findMovie(id) {
  return state.movies.find((movie) => movie.id === Number(id));
}

/**
 * Retrouve le nom d'un genre à partir de son identifiant.
 * @param {number} genreId
 * @returns {string}
 */
export function genreName(genreId) {
  const genre = state.genres.find((g) => g.id === genreId);
  return genre ? genre.name : '';
}
