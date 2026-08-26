/**
 * Petites aides DOM partagées par les vues.
 * Volontairement minimal : pas de framework, pas de moteur de template.
 */

/**
 * Échappe une chaîne destinée à être injectée dans du HTML.
 * À utiliser systématiquement sur les données venant de l'API.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

/**
 * Bloc "chargement en cours".
 * @param {string} [message]
 */
export function loadingState(message = 'Chargement des films…') {
  return `
    <div class="state state--loading">
      <span class="spinner" aria-hidden="true"></span>
      <p class="state__text">${escapeHtml(message)}</p>
    </div>`;
}

/**
 * Bloc "aucun résultat".
 * @param {string} title
 * @param {string} [text]
 */
export function emptyState(title, text = '') {
  return `
    <div class="state state--empty">
      <h2 class="state__title">${escapeHtml(title)}</h2>
      ${text ? `<p class="state__text">${escapeHtml(text)}</p>` : ''}
    </div>`;
}

/**
 * Bloc d'erreur.
 * @param {string} message
 * @param {string} [actionLabel] libellé d'un bouton de réessai (id="state-retry")
 */
export function errorState(message, actionLabel = '') {
  return `
    <div class="state state--error">
      <h2 class="state__title">Oups</h2>
      <p class="state__text">${escapeHtml(message)}</p>
      ${actionLabel ? `<button class="btn btn--primary" id="state-retry" type="button">${escapeHtml(actionLabel)}</button>` : ''}
    </div>`;
}

/**
 * Marqueur visuel pour les fonctionnalités qui restent à développer
 * pendant la phase 2. À supprimer une fois la fonctionnalité livrée.
 * @param {number} featureNumber
 * @param {string} title
 * @param {string} description
 */
export function featurePlaceholder(featureNumber, title, description) {
  return `
    <div class="placeholder">
      <p class="placeholder__badge">Fonctionnalité ${featureNumber} — à développer</p>
      <h2 class="placeholder__title">${escapeHtml(title)}</h2>
      <p class="placeholder__text">${escapeHtml(description)}</p>
      <p class="placeholder__hint">
        Cette vue est un point d'accroche prêt à l'emploi : le routeur, l'état global
        et le client TMDB fonctionnent déjà. Voir <code>docs/FEATURES.md</code>.
      </p>
    </div>`;
}

/**
 * Formate une date ISO en date lisible en français.
 * @param {string|null} isoDate
 */
export function formatDate(isoDate) {
  if (!isoDate) return 'Date inconnue';
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Arrondit un nombre pour l'affichage.
 * @param {number} value
 * @param {number} [decimals]
 */
export function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}
