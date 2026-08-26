/**
 * Routeur par hash (#/chemin).
 *
 * Choix assumé : pas d'History API, pour que le projet fonctionne aussi bien
 * derrière un vrai serveur qu'en ouvrant simplement le dossier. Une route est
 * une chaîne pouvant contenir des paramètres, ex. '/movie/:id'.
 *
 * Une vue est une fonction `async (params, container) => void` qui remplit
 * le conteneur. Elle peut retourner une fonction de nettoyage, appelée
 * automatiquement au changement de route (utile pour retirer des listeners
 * ou se désabonner du store).
 */

const routes = [];
let notFoundView = null;
let cleanup = null;
let container = null;

/**
 * Déclare une route.
 * @param {string} pattern  ex. '/', '/movie/:id'
 * @param {Function} view
 */
export function route(pattern, view) {
  routes.push({ pattern, view, ...compile(pattern) });
}

/**
 * Déclare la vue affichée quand aucune route ne correspond.
 * @param {Function} view
 */
export function notFound(view) {
  notFoundView = view;
}

/**
 * Démarre le routeur.
 * @param {HTMLElement} mountPoint
 */
export function start(mountPoint) {
  container = mountPoint;
  window.addEventListener('hashchange', resolve);
  resolve();
}

/**
 * Navigue par programme.
 * @param {string} path  ex. '/movie/550'
 */
export function navigate(path) {
  window.location.hash = `#${path}`;
}

/** @returns {string} le chemin courant, ex. '/movie/550' */
export function currentPath() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

async function resolve() {
  const path = currentPath();

  if (typeof cleanup === 'function') {
    cleanup();
    cleanup = null;
  }

  const match = findMatch(path);
  container.innerHTML = '';
  highlightNav(path);

  try {
    if (match) {
      cleanup = await match.view(match.params, container);
    } else if (notFoundView) {
      cleanup = await notFoundView({}, container);
    }
  } catch (error) {
    console.error('[router] la vue a échoué :', error);
    container.innerHTML = `
      <div class="container">
        <div class="state state--error">
          <h2 class="state__title">Une erreur est survenue</h2>
          <p class="state__text">${escapeHtml(error.message || String(error))}</p>
        </div>
      </div>`;
  }

  window.scrollTo({ top: 0 });
}

function findMatch(path) {
  for (const entry of routes) {
    const result = entry.regex.exec(path);
    if (!result) continue;

    const params = {};
    entry.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(result[index + 1]);
    });
    return { view: entry.view, params };
  }
  return null;
}

/** Transforme '/movie/:id' en expression régulière + liste de paramètres. */
function compile(pattern) {
  const keys = [];
  const source = pattern
    .replace(/\/$/, '')
    .replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${source || '/'}/?$`), keys };
}

function highlightNav(path) {
  const links = document.querySelectorAll('[data-route]');
  for (const link of links) {
    const target = link.getAttribute('data-route');
    const isActive = target === '/' ? path === '/' : path.startsWith(target);
    link.classList.toggle('is-active', isActive);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}
