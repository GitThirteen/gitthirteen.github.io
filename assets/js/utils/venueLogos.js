export const DEFAULT_PAPER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none">
        <rect width="120" height="70" fill="#111111"/>
        <path d="M48 18H66L74 26V52H48V18Z" fill="#1c1a1d" stroke="#ff3b30" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M66 18V26H74" stroke="#ff3b30" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="53" y1="32" x2="69" y2="32" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="53" y1="38" x2="69" y2="38" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="53" y1="44" x2="63" y2="44" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
`)}`;

const VENUE_MATCHERS = [
    { logo: 'https://cdn.simpleicons.org/acm/white', doiPrefix: '10.1145', urlPart: 'acm.org' },
    { logo: 'https://cdn.simpleicons.org/ieee/00629B', doiPrefix: '10.1109', urlPart: 'ieee.org' },
    { logo: 'https://cdn.simpleicons.org/arxiv/B31B1B', doiPrefix: '10.48550', urlPart: 'arxiv.org' },
    { logo: 'https://cdn.simpleicons.org/springer/white', doiPrefix: '10.1007', urlPart: 'springer' },
    { logo: 'https://cdn.simpleicons.org/elsevier/FF6C00', doiPrefix: '10.1016', urlPart: 'elsevier' }
];

/** Resolves a publisher logo from a DOI/URL, falling back to a generic paper graphic. */
export function getVenueLogoUrl(doi = '', url = '') {
    const cleanDoi = (doi || '').toLowerCase();
    const cleanUrl = (url || '').toLowerCase();

    const match = VENUE_MATCHERS.find(
        ({ doiPrefix, urlPart }) => cleanDoi.startsWith(doiPrefix) || cleanUrl.includes(urlPart)
    );

    return match ? match.logo : DEFAULT_PAPER_SVG;
}

/**
 * Swaps a broken paper thumbnail for the matching venue logo (or the generic fallback).
 * @param {HTMLImageElement} imgElement
 * @param {{ doi?: string, url?: string }} [source]
 */
export function attachImageFallback(imgElement, { doi = '', url = '' } = {}) {
    imgElement.onerror = () => {
        imgElement.onerror = null;

        const venueLogo = getVenueLogoUrl(doi, url);
        imgElement.src = venueLogo;

        if (venueLogo !== DEFAULT_PAPER_SVG) {
            imgElement.classList.add('venue-logo-thumb');
        }
    };
}
