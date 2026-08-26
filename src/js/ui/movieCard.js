/**
 * Carte de film — composant d'affichage partagé.
 *
 * Rendu volontairement extensible : les fonctionnalités de la phase 2
 * viennent se brancher dans les zones prévues plutôt que de dupliquer
 * la carte (bouton favori, badge de score, case du comparateur…).
 */

import { posterUrl } from '../api/tmdb.js';
import { genreName } from '../core/store.js';
import { escapeHtml, round } from './dom.js';

/**
 * @param {Object} movie                film normalisé
 * @param {Object} [options]
 * @param {number|null} [options.score] score calculé (fonctionnalité 2)
 * @param {string} [options.reasons]    HTML de justification (fonctionnalité 5)
 * @param {string} [options.actions]    HTML injecté dans la barre d'actions
 *                                      (favoris, comparateur…)
 * @returns {string} HTML de la carte
 */
export function movieCard(movie, { score = null, reasons = '', actions = '' } = {}) {
  const poster = posterUrl(movie.posterPath, 'w342');
  const genres = movie.genreIds.slice(0, 2).map(genreName).filter(Boolean);

  return `
    <article class="card" data-movie-id="${movie.id}">
      <a class="card__media" href="#/movie/${movie.id}" aria-label="${escapeHtml(movie.title)}">
        ${poster
          ? `<img class="card__poster" src="${poster}" alt="Affiche de ${escapeHtml(movie.title)}" loading="lazy">`
          : `<div class="card__poster card__poster--empty" aria-hidden="true">🎬</div>`}
        ${score !== null ? `<span class="card__score" title="Score de recommandation">${round(score, 1)}</span>` : ''}
      </a>

      <div class="card__body">
        <h3 class="card__title">
          <a href="#/movie/${movie.id}">${escapeHtml(movie.title)}</a>
        </h3>

        <p class="card__meta">
          <span class="card__year">${movie.year ?? '—'}</span>
          <span class="card__sep" aria-hidden="true">·</span>
          <span class="card__rating">★ ${round(movie.voteAverage, 1)}</span>
          <span class="card__sep" aria-hidden="true">·</span>
          <span class="card__votes">${movie.voteCount.toLocaleString('fr-FR')} votes</span>
        </p>

        ${genres.length
          ? `<p class="card__genres">${genres.map((g) => `<span class="chip">${escapeHtml(g)}</span>`).join('')}</p>`
          : ''}

        ${reasons ? `<div class="card__reasons">${reasons}</div>` : ''}
        ${actions ? `<div class="card__actions">${actions}</div>` : ''}
      </div>
    </article>`;
}

/**
 * Grille de cartes.
 * @param {Array} movies
 * @param {(movie: Object) => Object} [optionsFor] options par film
 */
export function movieGrid(movies, optionsFor = () => ({})) {
  return `<div class="grid">${movies.map((m) => movieCard(m, optionsFor(m))).join('')}</div>`;
}
