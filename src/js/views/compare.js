/**
 * Vue "Comparateur" — fonctionnalité 6.
 *
 * À développer : sélectionner deux films, afficher un tableau comparatif
 * (note, popularité, date de sortie, nombre de votes), et gérer proprement
 * la désélection ainsi que le cas où moins de deux films sont choisis.
 * L'état global expose déjà `state.comparison` (tableau d'identifiants).
 */

import { featurePlaceholder } from '../ui/dom.js';

export async function compareView(_params, container) {
  container.innerHTML = `
    <div class="container">
      ${featurePlaceholder(
        6,
        'Comparateur de films',
        'Deux films sélectionnés côte à côte, avec un tableau comparatif de leurs indicateurs.',
      )}
    </div>`;
}
