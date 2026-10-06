export const DEFAULT_LANG = 'en';

// Languages offered in the picker, in menu order. `name` is the endonym shown in the dropdown.
export const SUPPORTED_LANGS = Object.freeze([
    { code: 'en', name: 'English', flag: 'gb' },
    { code: 'de', name: 'Deutsch', flag: 'de' },
    { code: 'es', name: 'Español', flag: 'es' },
    { code: 'ru', name: 'Русский', flag: 'ru' },
    { code: 'ja', name: '日本語', flag: 'jp' }
]);

const STORAGE_KEY = 'preferred-lang';
const localeCache = new Map();

let currentLang = DEFAULT_LANG;
let currentMessages = {};
let fallbackMessages = {};

const isSupported = (code) => SUPPORTED_LANGS.some((lang) => lang.code === code);

/** Normalizes a BCP-47 tag (e.g. "de-AT") to a supported base code, or null. */
const normalize = (tag) => {
    if (!tag) return null;
    const base = String(tag).toLowerCase().split('-')[0];
    return isSupported(base) ? base : null;
};

const readStoredLang = () => {
    try {
        return normalize(localStorage.getItem(STORAGE_KEY));
    } catch {
        // localStorage can throw in privacy-restricted contexts.
        return null;
    }
};

const storeLang = (code) => {
    try {
        localStorage.setItem(STORAGE_KEY, code);
    } catch {
        // Persistence is a nice-to-have; ignore failures.
    }
};

const readUrlLang = () => normalize(new URLSearchParams(window.location.search).get('lang'));

// A stale "#?lang=xx" hash (e.g. from an older build or a hand-edited URL) would otherwise
// survive every switch and shadow the real query parameter, so strip it.
const isStaleLangHash = (hash) => /^#\?.*\blang=/.test(hash);

/** Reflects the active language in the URL so the page stays shareable. */
const syncUrl = (code) => {
    const url = new URL(window.location.href);

    if (code === DEFAULT_LANG) {
        url.searchParams.delete('lang');
    } else {
        url.searchParams.set('lang', code);
    }

    if (isStaleLangHash(url.hash)) url.hash = '';

    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
};

const readBrowserLang = () => {
    for (const tag of navigator.languages || [navigator.language]) {
        const match = normalize(tag);
        if (match) return match;
    }
    return null;
};

/** Resolves the language to use: ?lang= > stored preference > browser > default. */
export const resolveLang = () => readUrlLang() || readStoredLang() || readBrowserLang() || DEFAULT_LANG;

const fetchLocale = async (code) => {
    if (localeCache.has(code)) return localeCache.get(code);

    const res = await fetch(`locales/${code}.json`);
    if (!res.ok) {
        throw new Error(`Failed to load locale "locales/${code}.json": ${res.status} ${res.statusText}`);
    }

    const messages = await res.json();
    localeCache.set(code, messages);
    return messages;
};

const lookup = (messages, key) =>
    key.split('.').reduce((value, part) => (value == null ? undefined : value[part]), messages);

const interpolate = (template, vars) =>
    template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));

/**
 * Resolves a dot-path translation key.
 * Falls back to English, then to the key itself so gaps are visible rather than blank.
 */
export const t = (key, vars = {}) => {
    const value = lookup(currentMessages, key) ?? lookup(fallbackMessages, key) ?? key;
    return typeof value === 'string' ? interpolate(value, vars) : value;
};

/** Loads a language, applies it to the document, and returns the active code. */
export const setLanguage = async (code) => {
    const next = isSupported(code) ? code : DEFAULT_LANG;

    const [messages, fallback] = await Promise.all([
        fetchLocale(next),
        next === DEFAULT_LANG ? Promise.resolve(null) : fetchLocale(DEFAULT_LANG)
    ]);

    currentLang = next;
    currentMessages = messages;
    fallbackMessages = fallback ?? messages;

    storeLang(next);
    syncUrl(next);
    applyTranslations();

    return next;
};

export const getLanguage = () => currentLang;

/** Returns the endonym for a language code (e.g. "de" -> "Deutsch"). */
export const getLanguageName = (code = currentLang) =>
    SUPPORTED_LANGS.find((lang) => lang.code === code)?.name ?? code;

const setText = (el, value) => {
    if (typeof value === 'string') el.textContent = value;
};

const setHtml = (el, value) => {
    if (typeof value === 'string') el.innerHTML = value;
};

const setAttr = (el, spec, value) => {
    if (typeof value !== 'string') return;

    // Spec format: "attr:key" or "attr:key|attr2:key2"
    spec.split('|').forEach((pair) => {
        const [attr, key] = pair.split(':').map((part) => part.trim());
        if (attr && key) el.setAttribute(attr, value);
    });
};

/** Applies the active locale to every tagged element and to the document metadata. */
export const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach((el) => setText(el, t(el.dataset.i18n)));
    document.querySelectorAll('[data-i18n-html]').forEach((el) => setHtml(el, t(el.dataset.i18nHtml)));

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        el.dataset.i18nAttr.split('|').forEach((pair) => {
            const [attr, key] = pair.split(':').map((part) => part.trim());
            if (attr && key) setAttr(el, `${attr}:${key}`, t(key, { language: getLanguageName() }));
        });
    });

    document.documentElement.lang = currentLang;

    const title = t('meta.title');
    if (typeof title === 'string') document.title = title;

    const description = t('meta.description');
    if (typeof description === 'string') {
        document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    }

    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLang } }));
};
