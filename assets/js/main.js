document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.querySelector('.lang-btn');
    const langPicker = document.querySelector('.lang-picker');

    if (!langBtn || !langPicker) return;

    // Toggle dropdown on button click
    langBtn.addEventListener('click', () => {
        const isOpen = langBtn.getAttribute('aria-expanded') === 'true';
            langBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close when clicking outside the component
    document.addEventListener('click', (e) => {
        if (!langPicker.contains(e.target)) {
            langBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Close when pressing Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && langBtn.getAttribute('aria-expanded') === 'true') {
            langBtn.setAttribute('aria-expanded', 'false');
            langBtn.focus();
        }
    });
});

function getDoiImageFilename(doi) {
    if (!doi) return 'default.png';
    return doi.replace(/[^a-zA-Z0-9.-]/g, '_') + '.png';
}

const renderPublications = (publications) => {
    const section = document.getElementById('publications');
    if (!section) return;

    const placeholder = section.querySelector('p');
    if (placeholder) placeholder.remove();

    if (publications.length === 0) {
        section.insertAdjacentHTML('beforeend', '<p>0 publications found.</p>');
        return;
    }

    const container = document.createElement('div');
    container.className = 'publications-list';

    publications.forEach((pub) => {
        const item = document.createElement('a');
        item.className = 'publication-card';
        item.href = pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : '#');
        item.target = '_blank';
        item.rel = 'noopener noreferrer';

        const authorsText = Array.isArray(pub.authors)
            ? pub.authors.join(', ')
            : (pub.authors || 'Michael Eickmeyer');

        const dateText = pub.publicationDate || pub.year || 'Unknown date';

        const imageFilename = pub.image || (pub.doi ? getDoiImageFilename(pub.doi) : `${pub.id}.png`);
        const imgSrc = `assets/img/papers/${imageFilename}`;
    
        item.innerHTML = `
            <div class="publication-thumb">
                <img 
                src="${imgSrc}" 
                alt="Teaser image for ${pub.title}" 
                loading="lazy"
                onerror="this.onerror=null; this.src='assets/img/other/profile.jpg';"
                >
            </div>
            <div class="publication-content">
                <h3 class="publication-title">${pub.title}</h3>
                <p class="publication-authors">${authorsText}</p>
                <div class="publication-meta">
                <span class="publication-date">${dateText}</span>
                ${pub.type ? `<span class="publication-badge">${pub.type.replace('-', ' ')}</span>` : ''}
                </div>
            </div>
        `;

        container.appendChild(item);
    });

    section.appendChild(container);                 
}

const renderProjects = (repositories) => {
    const section = document.getElementById('projects');
    if (!section || repositories.length === 0) return;

    const container = document.createElement('div');
    container.className = 'projects-grid';

    repositories.forEach((repo) => {
        const item = document.createElement('a');
        item.className = 'project-card';
        item.href = repo.homepage || repo.url;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';

        const imageSrc = `assets/img/projects/${repo.name.toLowerCase()}.png`;

        item.innerHTML = `
            <img 
                src="${imageSrc}" 
                alt="${repo.name}" 
                loading="lazy"
                onerror="this.onerror=null; this.src='assets/img/other/profile.jpg';"
            >
            <div class="project-overlay">
                <span class="project-name">${repo.name}</span>
            </div>
        `;

        container.appendChild(item);
    });

    section.appendChild(container);
}

(async () => {
    const res = await fetch('./assets/json/data.json');
    const { lastUpdated, publications, repositories } = await res.json();

    console.log(`Last updated on: ${lastUpdated}`);

    renderPublications(publications);
    renderProjects(repositories);
})();