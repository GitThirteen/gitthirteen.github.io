import { blacklist, whitelist } from '../config.js';
import { t } from '../i18n.js';

const FALLBACK_THUMB = 'assets/img/icons/GitHub_Invertocat_White.svg';
const FILTER_ANIMATION_MS = 150;

const matchesFilter = (repo, filter) => {
    if (filter !== 'current') return true;
    return whitelist.currentProjects.some((name) => name.toLowerCase() === repo.name.toLowerCase());
};

const createProjectCard = (repo) => {
    const item = document.createElement('a');
    item.className = 'project-card';
    item.href = repo.homepage || repo.url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';

    item.innerHTML = `
        <img src="assets/img/projects/${repo.name.toLowerCase()}.png" alt="${repo.name}" loading="lazy">
        <div class="project-overlay">
            <span class="project-name">${repo.name}</span>
            ${repo.description ? `<p class="project-desc">${repo.description}</p>` : ''}
        </div>
    `;

    const img = item.querySelector('img');
    img.onerror = () => {
        img.onerror = null;
        img.src = FALLBACK_THUMB;
        img.classList.add('fallback-thumb');
    };

    return item;
};

/** Renders the project grid for the given filter ('current' or 'all'). */
export const renderProjects = (repositories, filter = 'current') => {
    const section = document.getElementById('projects');
    if (!section || repositories.length === 0) return;

    let container = section.querySelector('.projects-grid');
    if (!container) {
        container = document.createElement('div');
        container.className = 'projects-grid';
        section.appendChild(container);
    }
    container.innerHTML = '';

    const visible = repositories
        .filter((repo) => !blacklist.projects?.includes(repo.name))
        .filter((repo) => matchesFilter(repo, filter));

    if (visible.length === 0) {
        const key = filter === 'current' ? 'projects.emptyCurrent' : 'projects.empty';
        container.innerHTML = `<p class="projects-empty">${t(key)}</p>`;
        return;
    }

    visible.forEach((repo) => container.appendChild(createProjectCard(repo)));
};

/**
 * Wires up the Current/All filter buttons.
 * @param {Array} repositories
 * @param {(filter: string) => void} [onFilterChange] Notified when the active filter changes.
 */
export const initProjectFilter = (repositories, onFilterChange) => {
    const buttons = document.querySelectorAll('.filter-btn');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) return;

            buttons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            onFilterChange?.(btn.dataset.filter);

            const container = document.querySelector('.projects-grid');
            if (!container) {
                renderProjects(repositories, btn.dataset.filter);
                return;
            }

            container.classList.add('is-filtering');

            setTimeout(() => {
                renderProjects(repositories, btn.dataset.filter);
                requestAnimationFrame(() => container.classList.remove('is-filtering'));
            }, FILTER_ANIMATION_MS);
        });
    });
};
