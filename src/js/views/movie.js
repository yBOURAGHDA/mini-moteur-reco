/**
 * Vue "Détail d'un film".
 *
 * Sert de base à la fonctionnalité 7 (recommandation à partir d'un film
 * choisi) : le bloc #similar-slot est prêt à recevoir la liste des films
 * similaires renvoyée par `fetchSimilarMovies()`.
 */

import { fetchMovie, posterUrl, TmdbError } from '../api/tmdb.js';
import { escapeHtml, errorState, formatDate, loadingState, round } from '../ui/dom.js';

export async function movieView({ id }, container) {
  container.innerHTML = `<div class="container">${loadingState('Chargement du film…')}</div>`;

  let movie;
  try {
    movie = await fetchMovie(id);
  } catch (error) {
    const message = error instanceof TmdbError ? error.message : 'Film introuvable.';
    container.innerHTML = `<div class="container">${errorState(message)}</div>`;
    return;
  }

  const backdrop = posterUrl(movie.backdropPath, 'original');
  const poster = posterUrl(movie.posterPath, 'w500');

  container.innerHTML = `
    <div class="detail">
      ${backdrop ? `<div class="detail__backdrop" style="background-image:url('${backdrop}')"></div>` : ''}

      <div class="container detail__inner">
        <a class="detail__back" href="#/">← Retour</a>

        <div class="detail__head">
          ${poster
            ? `<img class="detail__poster" src="${poster}" alt="Affiche de ${escapeHtml(movie.title)}">`
            : `<div class="detail__poster detail__poster--empty" aria-hidden="true">🎬</div>`}

          <div class="detail__info">
            <h1 class="detail__title">${escapeHtml(movie.title)}</h1>
            ${movie.tagline ? `<p class="detail__tagline">${escapeHtml(movie.tagline)}</p>` : ''}

            <ul class="detail__stats">
              <li><strong>${round(movie.voteAverage, 1)}</strong><span>Note moyenne</span></li>
              <li><strong>${movie.voteCount.toLocaleString('fr-FR')}</strong><span>Votes</span></li>
              <li><strong>${round(movie.popularity, 0)}</strong><span>Popularité</span></li>
              <li><strong>${movie.runtime ? `${movie.runtime} min` : '—'}</strong><span>Durée</span></li>
            </ul>

            <p class="detail__release">Sortie : ${escapeHtml(formatDate(movie.releaseDate))}</p>

            ${movie.genres.length
              ? `<p class="detail__genres">${movie.genres
                  .map((g) => `<span class="chip">${escapeHtml(g.name)}</span>`)
                  .join('')}</p>`
              : ''}

            <!-- Fonctionnalité 4 : bouton favori — Fonctionnalité 6 : ajout au comparateur -->
            <div class="detail__actions" id="movie-actions-slot"></div>
          </div>
        </div>

        ${movie.overview
          ? `<section class="detail__section">
               <h2 class="detail__subtitle">Synopsis</h2>
               <p class="detail__overview">${escapeHtml(movie.overview)}</p>
             </section>`
          : ''}

        <!-- Fonctionnalité 5 : explication du score -->
        <section class="detail__section" id="reasons-slot"></section>

        <!-- Fonctionnalité 7 : films similaires -->
        <section class="detail__section" id="similar-slot"></section>
      </div>
    </div>`;
}
