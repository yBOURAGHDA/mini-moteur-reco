/**
 * Gestion de la clé API TMDB.
 *
 * Deux sources possibles, dans cet ordre :
 *   1. le localStorage du navigateur, alimenté par la boîte de dialogue "Clé API"
 *   2. `src/js/config.js` (fichier local optionnel, ignoré par git)
 *
 * Le localStorage est consulté en premier : une clé saisie dans l'interface
 * est un geste explicite de l'utilisateur, elle doit primer sur le fichier.
 * Cet ordre évite aussi de chercher `config.js` à chaque chargement, ce qui
 * produisait un 404 inutile dans la console.
 *
 * Aucune clé n'est jamais écrite en dur dans un fichier commité.
 */

const STORAGE_KEY = 'cinescore:tmdb_api_key';

let cachedKey = null;
let configLoaded = false;

/**
 * Tente de charger `src/js/config.js`. Le fichier étant optionnel (et gitignoré),
 * son absence n'est pas une erreur : on retombe simplement sur le localStorage.
 * @returns {Promise<string>} la clé trouvée, ou une chaîne vide
 */
async function loadFromConfigFile() {
  try {
    const module = await import('../config.js');
    return (module.TMDB_API_KEY || '').trim();
  } catch {
    return '';
  }
}

/**
 * Retourne la clé API courante, ou une chaîne vide si aucune n'est configurée.
 * @returns {Promise<string>}
 */
export async function getApiKey() {
  if (cachedKey) return cachedKey;

  const fromStorage = readStorage();
  if (fromStorage) {
    cachedKey = fromStorage;
    return cachedKey;
  }

  if (!configLoaded) {
    configLoaded = true;
    cachedKey = await loadFromConfigFile();
  }

  return cachedKey || '';
}

/**
 * Enregistre la clé dans le localStorage et vide le cache mémoire.
 * @param {string} key
 */
export function setApiKey(key) {
  cachedKey = key.trim();
  try {
    localStorage.setItem(STORAGE_KEY, cachedKey);
  } catch {
    // Navigation privée ou stockage désactivé : la clé reste valable
    // pour la session en cours, en mémoire uniquement.
  }
}

/** Supprime la clé enregistrée. */
export function clearApiKey() {
  cachedKey = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* rien à faire */
  }
}

/** @returns {Promise<boolean>} true si une clé est disponible */
export async function hasApiKey() {
  return Boolean(await getApiKey());
}

function readStorage() {
  try {
    return (localStorage.getItem(STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}
