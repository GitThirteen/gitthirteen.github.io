import { blacklist } from '../config.js';
import { t } from '../i18n.js';
import { formatAuthors, formatPubType, formatVenueCitation } from '../utils/format.js';
import { attachImageFallback } from '../utils/venueLogos.js';

const getDoiImageFilename = (doi) => (doi ? `${doi.replace(/[^a-zA-Z0-9.-]/g, '_')}.png` : 'default.png');

const getThumbnailSrc = (pub) => {
    const filename = pub.image || (pub.doi ? getDoiImageFilename(pub.doi) : `${pub.id}.png`);
    return `assets/img/papers/${filename}`;
};

const createPublicationCard = (pub) => {
    const item = document.createElement('a');
    item.className = 'publication-card';
    item.href = pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : '#');
    item.target = '_blank';
    item.rel = 'noopener noreferrer';

    item.innerHTML = `
        <div class="publication-thumb">
            ${pub.type ? `<span class="publication-thumb-badge">${formatPubType(pub.type)}</span>` : ''}
            <img src="${getThumbnailSrc(pub)}" alt="${t('publications.teaserAlt', { title: pub.title })}" loading="lazy">
        </div>
        <div class="publication-content">
            <h3 class="publication-title">${pub.title}</h3>
            <p class="publication-authors">${formatAuthors(pub.authors)}</p>
            <div class="publication-meta">
                <span class="publication-venue">${formatVenueCitation(pub)}</span>
            </div>
        </div>
    `;

    attachImageFallback(item.querySelector('img'), { doi: pub.doi, url: pub.url });
    return item;
};

/** Renders the publication cards into the #publications section. */
export const renderPublications = (publications) => {
    const section = document.getElementById('publications');
    if (!section) return;

    section.querySelector('.publication-count')?.remove();
    section.querySelector('.publications-list')?.remove();

    const visible = publications.filter((pub) => !blacklist.publications?.includes(pub.doi));

    const countKey = visible.length === 1 ? 'publications.count_one' : 'publications.count_other';
    section.insertAdjacentHTML(
        'beforeend',
        `<p class="publication-count">${t(countKey, { n: visible.length })}</p>`
    );

    if (visible.length === 0) return;

    const container = document.createElement('div');
    container.className = 'publications-list';
    visible.forEach((pub) => container.appendChild(createPublicationCard(pub)));

    section.appendChild(container);
};
