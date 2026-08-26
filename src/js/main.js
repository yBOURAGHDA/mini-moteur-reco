/**
 * Point d'entrée de l'application.
 *
 * Enchaînement : clé API -> genres -> routeur.
 * Rien d'autre ne doit vivre ici : chaque fonctionnalité s'installe dans
 * sa propre vue ou son propre module.
 */

import { fetchGenres, TmdbError } from './api/tmdb.js';
import { getApiKey, hasApiKey, setApiKey } from './core/apiKey.js';
import { notFound, route, start } from './core/router.js';
import { setState } from './core/store.js';
import { emptyState } from './ui/dom.js';
import { compareView } from './views/compare.js';
import { favoritesView } from './views/favorites.js';
import { homeView } from './views/home.js';
import { movieView } from './views/movie.js';
import { statsView } from './views/stats.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#api-key-dialog');
const form = document.querySelector('#api-key-form');
const input = document.querySelector('#api-key-input');
const errorLabel = document.querySelector('#api-key-error');

registerRoutes();
setupApiKeyDialog();
bootstrap();

/* ------------------------------------------------------------------ */

function registerRoutes() {
  route('/', homeView);
  route('/movie/:id', movieView);
  route('/favorites', favoritesView);
  route('/compare', compareView);
  route('/stats', statsView);

  notFound(async (_params, container) => {
    container.innerHTML = `
      <div class="container">
        ${emptyState('Page introuvable', 'Le lien que vous avez suivi ne mène nulle part.')}
        <p style="text-align:center"><a class="btn btn--primary" href="#/">Retour à l'accueil</a></p>
      </div>`;
  });
}

async function bootstrap() {
  if (!(await hasApiKey())) {
    openDialog();
    return;
  }

  await loadGenres();
  start(app);
}

/**
 * Charge la liste des genres une fois pour toutes.
 * Un échec ici n'est pas bloquant : les cartes s'afficheront sans nom de genre.
 */
async function loadGenres() {
  try {
    setState({ genres: await fetchGenres() });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 401) {
      openDialog('Cette clé API a été refusée par TMDB. Vérifiez-la et réessayez.');
      return;
    }
    console.warn('[main] genres indisponibles :', error);
  }
}

function setupApiKeyDialog() {
  document.querySelector('#btn-settings').addEventListener('click', async () => {
    input.value = await getApiKey();
    openDialog();
  });

  document.querySelector('#api-key-cancel').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;

    setApiKey(value);
    dialog.close();

    // On recharge la page : plus simple et plus sûr que de tenter de
    // réinitialiser un état applicatif déjà partiellement construit.
    window.location.reload();
  });
}

function openDialog(message = '') {
  errorLabel.hidden = !message;
  errorLabel.textContent = message;
  if (!dialog.open) dialog.showModal();
}
