/**
 * Client de l'API TMDB (v3).
 *
 * Toute la couche réseau est isolée ici : aucune vue ne doit appeler `fetch`
 * directement. Les fonctions retournent des données déjà normalisées, pour que
 * la logique métier (scoring, filtres, stats) travaille sur une forme stable.
 *
 * Documentation : https://developer.themoviedb.org/docs/getting-started
 */

import { getApiKey } from '../core/apiKey.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/** Erreur métier levée par le client TMDB. */
export class TmdbError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message);
    this.name = 'TmdbError';
    this.status = status;
    this.cause = cause;
  }
}

/**
 * Appel générique à l'API.
 * @param {string} path      chemin relatif, ex. '/discover/movie'
 * @param {Object} [params]  paramètres de requête
 * @returns {Promise<Object>} la réponse JSON
 */
async function request(path, params = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new TmdbError('Aucune clé API TMDB configurée.', { status: 401 });
  }

  const url = new URL(BASE_URL + path);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'fr-FR');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new TmdbError('Impossible de joindre TMDB. Vérifiez votre connexion.', { cause: error });
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new TmdbError('Clé API invalide ou expirée.', { status: 401 });
    }
    if (response.status === 429) {
      throw new TmdbError('Trop de requêtes envoyées à TMDB. Réessayez dans quelques secondes.', { status: 429 });
    }
    throw new TmdbError(`Erreur TMDB (HTTP ${response.status}).`, { status: response.status });
  }

  return response.json();
}

/**
 * Normalise un film brut de l'API vers la forme utilisée dans toute l'app.
 * Les vues et la logique de scoring ne manipulent que cette forme.
 * @param {Object} raw
 */
export function normalizeMovie(raw) {
  return {
    id: raw.id,
    title: raw.title || raw.original_title || 'Sans titre',
    overview: raw.overview || '',
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseDate: raw.release_date || null,
    year: raw.release_date ? Number(raw.release_date.slice(0, 4)) : null,
    voteAverage: Number(raw.vote_average) || 0,
    voteCount: Number(raw.vote_count) || 0,
    popularity: Number(raw.popularity) || 0,
    genreIds: raw.genre_ids || (raw.genres ? raw.genres.map((g) => g.id) : []),
    originalLanguage: raw.original_language || null,
  };
}

/**
 * Construit l'URL d'une affiche.
 * @param {string|null} path   chemin renvoyé par TMDB
 * @param {'w185'|'w342'|'w500'|'original'} [size]
 * @returns {string|null}
 */
export function posterUrl(path, size = 'w342') {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}

/**
 * Films populaires (page par page).
 * @param {number} [page]
 * @returns {Promise<{ movies: Array, page: number, totalPages: number }>}
 */
export async function fetchPopularMovies(page = 1) {
  const data = await request('/movie/popular', { page });
  return {
    movies: data.results.map(normalizeMovie),
    page: data.page,
    totalPages: Math.min(data.total_pages, 500), // TMDB plafonne à 500 pages
  };
}

/**
 * Découverte de films avec critères côté serveur.
 * Utilisé notamment par la fonctionnalité 1 (filtrage multi-critères).
 *
 * @param {Object} [options]
 * @param {number} [options.page]
 * @param {number|string} [options.genreId]        identifiant de genre TMDB
 * @param {number} [options.minYear]               année de sortie minimum
 * @param {number} [options.minRating]             note moyenne minimum (0-10)
 * @param {string} [options.language]              langue originale, ex. 'fr'
 * @param {string} [options.sortBy]                ex. 'popularity.desc'
 * @returns {Promise<{ movies: Array, page: number, totalPages: number }>}
 */
export async function discoverMovies({
  page = 1,
  genreId,
  minYear,
  minRating,
  language,
  sortBy = 'popularity.desc',
} = {}) {
  const data = await request('/discover/movie', {
    page,
    sort_by: sortBy,
    with_genres: genreId,
    'primary_release_date.gte': minYear ? `${minYear}-01-01` : undefined,
    'vote_average.gte': minRating,
    with_original_language: language,
    // Écarte le bruit statistique : un film noté 9/10 par 3 personnes
    // fausserait complètement le scoring.
    'vote_count.gte': 50,
    include_adult: false,
  });

  return {
    movies: data.results.map(normalizeMovie),
    page: data.page,
    totalPages: Math.min(data.total_pages, 500),
  };
}

/**
 * Détail complet d'un film.
 * @param {number|string} id
 */
export async function fetchMovie(id) {
  const raw = await request(`/movie/${id}`);
  return {
    ...normalizeMovie(raw),
    runtime: raw.runtime || null,
    tagline: raw.tagline || '',
    genres: raw.genres || [],
  };
}

/**
 * Films similaires à un film donné.
 * Base de la fonctionnalité 7 (recommandation à partir d'un film choisi).
 * @param {number|string} id
 */
export async function fetchSimilarMovies(id, page = 1) {
  const data = await request(`/movie/${id}/similar`, { page });
  return {
    movies: data.results.map(normalizeMovie),
    page: data.page,
    totalPages: Math.min(data.total_pages, 500),
  };
}

/**
 * Liste des genres de films.
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export async function fetchGenres() {
  const data = await request('/genre/movie/list');
  return data.genres || [];
}
