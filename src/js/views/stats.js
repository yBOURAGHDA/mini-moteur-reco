/**
 * Vue "Statistiques" — fonctionnalité 9 (dashboard).
 *
 * À développer : analyser les films actuellement chargés (`state.movies`)
 * pour en extraire la note moyenne, le film le plus populaire, le plus récent,
 * et la répartition par genre sous forme de graphique simple.
 * Ces indicateurs s'obtiennent par réduction/tri/agrégation sur le tableau.
 */

import { featurePlaceholder } from '../ui/dom.js';

export async function statsView(_params, container) {
  container.innerHTML = `
    <div class="container">
      ${featurePlaceholder(
        9,
        'Dashboard statistiques',
        'Indicateurs calculés sur les films affichés : note moyenne, film le plus populaire, film le plus récent, répartition par genre.',
      )}
    </div>`;
}
