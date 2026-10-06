const DATA_URL = './assets/json/data.json';

/**
 * Loads the synced site data (publications + repositories).
 * @param {string} [url] Override for the data source if wished (e.g. for testing).
 * @returns {Promise<{ lastUpdated: string, publications: Array, repositories: Array }>}
 */
export async function loadSiteData(url = DATA_URL) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
    }

    const { lastUpdated = null, publications = [], repositories = [] } = await res.json();
    return { lastUpdated, publications, repositories };
}
