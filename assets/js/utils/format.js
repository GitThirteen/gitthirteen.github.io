import { t } from '../i18n.js';

const toTitleCase = (value) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Renders an author list, highlighting the profile owner.
 * @param {string|string[]} authors
 * @param {string} target Name to highlight.
 */
export const formatAuthors = (authors, target = 'Michael Eickmeyer') => {
    const list = Array.isArray(authors) ? authors : authors ? [authors] : [];
    if (list.length === 0) return `<strong>${target}</strong>`;

    return list
        .map((author) => (author.toLowerCase().includes(target.toLowerCase()) ? `<strong>${author}</strong>` : author))
        .join(', ');
};

/** Builds the "In <venue> (<year>)" citation line for a publication. */
export const formatVenueCitation = (pub) => {
    const year = pub.year || (pub.publicationDate ? pub.publicationDate.split('-')[0] : '');
    const yearSuffix = year ? ` (${year})` : '';

    if (pub.venue) {
        // Crossref sometimes already prefixes the venue with "In ".
        const cleanVenue = pub.venue.replace(/^in\s+/i, '').trim();
        return `${t('citation.in')} ${cleanVenue}${yearSuffix}`;
    }

    if (pub.type === 'conference-paper' || pub.type === 'conference-proceedings') {
        return `${t('citation.proceedings')}${yearSuffix}`;
    }

    if (pub.type === 'journal-article') {
        return `${t('citation.journal')}${yearSuffix}`;
    }

    return `${t('citation.published')}${yearSuffix}`;
};

/** Maps a Crossref/ORCID work type to a human-readable, localized label. */
export const formatPubType = (type) => {
    if (!type) return '';

    const key = `pubTypes.${type.toLowerCase()}`;
    const label = t(key);

    // t() returns the key itself when no translation exists, so fall back to a prettified type.
    return label === key ? toTitleCase(type) : label;
};
