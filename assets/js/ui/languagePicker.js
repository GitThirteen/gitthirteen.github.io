import { SUPPORTED_LANGS, getLanguage, setLanguage } from '../i18n.js';

const FLAG_URL = (code) => `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;

// Absolute path so the link never resolves against a stale "#..." hash in the address bar,
// and so the language is a real, shareable URL even with JS disabled.
const buildLangHref = (code) => {
    const url = new URL(window.location.pathname, window.location.origin);
    if (code !== 'en') url.searchParams.set('lang', code);
    return `${url.pathname}${url.search}`;
};

/** Rebuilds the dropdown entries, marking the active language. */
const renderMenu = (menu, activeCode) => {
    menu.innerHTML = SUPPORTED_LANGS.map(({ code, name, flag }) => `
        <li>
            <a href="${buildLangHref(code)}" data-lang="${code}" lang="${code}" hreflang="${code}"
               ${code === activeCode ? 'aria-current="true"' : ''}>
                <img src="${FLAG_URL(flag)}" class="flag-icon" alt="" aria-hidden="true"> ${name}
            </a>
        </li>
    `).join('');
};

const syncButton = (btn, activeCode) => {
    const { flag } = SUPPORTED_LANGS.find((lang) => lang.code === activeCode) ?? SUPPORTED_LANGS[0];
    btn.querySelector('[data-lang-flag]')?.setAttribute('src', FLAG_URL(flag));
};

/** Language dropdown in the navigation drawer. Switches language in place. */
export function initLanguagePicker() {
    const langBtn = document.querySelector('.lang-btn');
    const langPicker = document.querySelector('.lang-picker');
    const menu = document.querySelector('[data-lang-menu]');

    if (!langBtn || !langPicker || !menu) return;

    const setOpen = (open) => langBtn.setAttribute('aria-expanded', String(open));
    const isOpen = () => langBtn.getAttribute('aria-expanded') === 'true';

    const refresh = () => {
        const active = getLanguage();
        renderMenu(menu, active);
        syncButton(langBtn, active);
    };

    langBtn.addEventListener('click', () => setOpen(!isOpen()));

    menu.addEventListener('click', async (e) => {
        const link = e.target.closest('a[data-lang]');
        if (!link) return;

        e.preventDefault();
        setOpen(false);

        const code = link.dataset.lang;
        if (code === getLanguage()) return;

        await setLanguage(code);
        refresh();
    });

    document.addEventListener('click', (e) => {
        if (!langPicker.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !isOpen()) return;

        setOpen(false);
        langBtn.focus();
    });

    refresh();
}
