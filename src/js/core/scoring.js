/**
 * Fonctionnalité 2 — Système de scoring personnalisé.
 *
 * Généré avec GitHub Copilot, puis corrigé à la main.
 * Les trois corrections apportées sont signalées par des commentaires
 * « CORRECTION » dans le fichier.
 */

import { DEFAULT_WEIGHTS } from './store.js';

const DEFAULTS = { ...DEFAULT_WEIGHTS };
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Fenêtre de récence, en années.
 *
 * CORRECTION 2 — Copilot étalait la récence sur (année courante - 1900),
 * soit 126 ans. Résultat : un film de 2026 obtenait 1.00 et un film de 2015
 * obtenait 0.91. Moins de 9 % d'écart entre un film tout neuf et un film de
 * dix ans, alors que c'est précisément ce que le critère est censé mesurer.
 * Avec un poids de 0,2 ça ne représentait qu'environ 1,7 point sur 100 : le
 * slider de récence de la fonctionnalité 3 n'aurait presque rien changé au
 * classement. Une fenêtre de 30 ans discrimine réellement.
 */
const RECENCY_WINDOW_YEARS = 30;

/** Popularité de référence au-delà de laquelle le critère est saturé. */
const POPULARITY_REFERENCE = 1000;

/** Nombre de votes de référence au-delà duquel le critère est saturé. */
const VOTE_COUNT_REFERENCE = 200000;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Note TMDB (0-10) ramenée entre 0 et 1. */
function normalizeRating(value) {
  return clamp(Number(value) || 0, 0, 10) / 10;
}

/**
 * Popularité ramenée entre 0 et 1.
 * Échelle logarithmique : la popularité n'a pas de maximum et quelques films
 * très en vogue écraseraient tous les autres sur une échelle linéaire.
 */
function normalizePopularity(value) {
  const popularity = Number(value) || 0;
  return clamp(Math.log1p(popularity) / Math.log1p(POPULARITY_REFERENCE), 0, 1);
}

/**
 * Récence ramenée entre 0 et 1.
 * Un film de l'année vaut 1, un film plus vieux que la fenêtre vaut 0.
 * Une année absente (fréquent sur TMDB) vaut 0 : on ne récompense pas
 * un film dont on ignore la date.
 */
function normalizeRecency(year) {
  if (!year || Number(year) <= 0) return 0;

  const age = CURRENT_YEAR - Number(year);
  return clamp(1 - age / RECENCY_WINDOW_YEARS, 0, 1);
}

/** Nombre de votes ramené entre 0 et 1, également en échelle logarithmique. */
function normalizeVoteCount(value) {
  const votes = Number(value) || 0;
  return clamp(Math.log1p(votes) / Math.log1p(VOTE_COUNT_REFERENCE), 0, 1);
}

/**
 * Lit une pondération en acceptant la valeur 0.
 *
 * CORRECTION 1 — le vrai bug. Copilot avait écrit :
 *
 *     rating: Number(weights?.rating) || DEFAULTS.rating
 *
 * En JavaScript, `0` est falsy. Donc mettre un curseur à zéro — c'est-à-dire
 * dire « je ne veux pas du tout tenir compte de ce critère » — faisait
 * basculer sur la pondération par défaut au lieu de l'annuler. Le curseur
 * aurait semblé cassé dans la fonctionnalité 3, sans aucune erreur en console.
 *
 * On ne remplace donc par la valeur par défaut que si la valeur est
 * réellement absente ou invalide, jamais si elle vaut 0.
 *
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function readWeight(value, fallback) {
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight < 0) return fallback;
  return weight;
}

/**
 * Calcule un score de recommandation entre 0 et 100 pour un film.
 *
 * CORRECTION 3 — ce bloc de documentation était placé au-dessus de l'import
 * généré par Copilot, donc il ne documentait plus la fonction. Remis à sa place.
 *
 * Les quatre critères n'ont pas la même échelle (note sur 10, popularité sans
 * maximum, votes par milliers, année). Chacun est ramené entre 0 et 1 avant
 * d'être pondéré, sinon la popularité écraserait tout le reste.
 *
 * @param {Object} movie     film normalisé (voteAverage, popularity, voteCount, year)
 * @param {Object} [weights] pondérations { rating, popularity, recency, voteCount }
 * @returns {number} score entre 0 et 100, arrondi à deux décimales
 */
export function computeScore(movie, weights = DEFAULTS) {
  if (!movie || typeof movie !== 'object') return 0;

  const safeWeights = {
    rating: readWeight(weights?.rating, DEFAULTS.rating),
    popularity: readWeight(weights?.popularity, DEFAULTS.popularity),
    recency: readWeight(weights?.recency, DEFAULTS.recency),
    voteCount: readWeight(weights?.voteCount, DEFAULTS.voteCount),
  };

  // Si l'utilisateur met tous les curseurs à zéro, aucun critère ne compte :
  // tous les films sont à égalité à 0 plutôt que de diviser par zéro.
  const totalWeight = Object.values(safeWeights).reduce((sum, value) => sum + value, 0);
  if (totalWeight === 0) return 0;

  const score = (
    normalizeRating(movie.voteAverage) * safeWeights.rating +
    normalizePopularity(movie.popularity) * safeWeights.popularity +
    normalizeRecency(movie.year) * safeWeights.recency +
    normalizeVoteCount(movie.voteCount) * safeWeights.voteCount
  ) / totalWeight * 100;

  return Number(score.toFixed(2));
}

/**
 * Trie une liste de films par score décroissant.
 * Ne modifie pas le tableau d'origine.
 *
 * @param {Array} movies
 * @param {Object} weights
 * @returns {Array} nouveaux objets film, enrichis d'une propriété `score`
 */
export function rankMovies(movies, weights) {
  return movies
    .map((movie) => ({ ...movie, score: computeScore(movie, weights) }))
    .sort((a, b) => b.score - a.score);
}
