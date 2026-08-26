/**
 * Vue "Mes recommandations" — fonctionnalité 4 (favoris persistants).
 *
 * À développer : lire les favoris depuis le localStorage, afficher les films
 * correspondants, permettre le retrait, gérer le cas de la liste vide.
 * L'état global expose déjà `state.favorites` (tableau d'identifiants).
 */

import { featurePlaceholder } from '../ui/dom.js';

export async function favoritesView(_params, container) {
  container.innerHTML = `
    <div class="container">
      ${featurePlaceholder(
        4,
        'Mes recommandations',
        'Les films ajoutés en favori seront listés ici, et conservés d\'une session à l\'autre via le localStorage.',
      )}
    </div>`;
}
