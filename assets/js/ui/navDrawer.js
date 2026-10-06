/** Burger button that toggles the navigation drawer. */
export function initNavDrawer() {
    const burgerBtn = document.querySelector('.burger-btn');
    const navDrawer = document.querySelector('.nav-drawer');

    if (!burgerBtn || !navDrawer) return;

    const isOpen = () => navDrawer.classList.contains('is-open');

    const setOpen = (open) => {
        burgerBtn.setAttribute('aria-expanded', String(open));
        navDrawer.classList.toggle('is-open', open);
    };

    burgerBtn.addEventListener('click', () => setOpen(!isOpen()));

    // Auto-close when clicking an in-page jumper anchor.
    navDrawer.querySelectorAll('.jumpers a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('click', (e) => {
        if (!burgerBtn.contains(e.target) && !navDrawer.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !isOpen()) return;

        setOpen(false);
        burgerBtn.focus();
    });
}
