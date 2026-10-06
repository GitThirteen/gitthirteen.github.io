import { loadSiteData } from './data.js';
import { applyTranslations, getLanguage, resolveLang, setLanguage, t } from './i18n.js';
import { initLanguagePicker } from './ui/languagePicker.js';
import { initNavDrawer } from './ui/navDrawer.js';
import { initScrollbar } from './ui/scrollbar.js';
import { renderPublications } from './content/publications.js';
import { initProjectFilter, renderProjects } from './content/projects.js';

let siteData = null;
let activeFilter = 'current';

const updateLastSynced = () => {
    const syncer = document.getElementById('last-synced');
    if (!syncer) return;

    if (!siteData?.lastUpdated) {
        syncer.textContent = t('footer.synced');
        return;
    }

    const formattedDate = new Date(siteData.lastUpdated).toLocaleDateString(getLanguage(), {
        month: 'short',
        year: 'numeric'
    });

    syncer.textContent = t('footer.lastSynced', { date: formattedDate });
};

const renderContent = () => {
    if (!siteData) return;

    updateLastSynced();
    renderPublications(siteData.publications);
    renderProjects(siteData.repositories, activeFilter);
};

const initUi = () => {
    initScrollbar();
    initLanguagePicker();
    initNavDrawer();
};

const initContent = async () => {
    siteData = await loadSiteData();
    renderContent();

    initProjectFilter(siteData.repositories, (filter) => {
        activeFilter = filter;
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await setLanguage(resolveLang());
    } catch (err) {
        console.error('Failed to load locale, keeping markup defaults:', err);
        applyTranslations();
    }

    initUi();

    // Re-render dynamic content (counts, badges, empty states) whenever the language changes.
    document.addEventListener('languagechange', renderContent);

    try {
        await initContent();
    } catch (err) {
        console.error('Failed to initialize site content:', err);
    }
});
