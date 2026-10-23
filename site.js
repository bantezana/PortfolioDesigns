// Shared behavior: nav scroll state, scroll-reveal with stagger, back-to-top.
(function () {
    const nav = document.querySelector('.site-nav');
    const backToTop = document.querySelector('.back-to-top');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function onScroll() {
        const y = window.scrollY;
        if (nav) nav.classList.toggle('is-scrolled', y > 8);
        if (backToTop) backToTop.classList.toggle('is-visible', y > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    // Stagger existing reveal items by DOM order within their parent
    document.querySelectorAll('.case-card').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.1}s`;
    });

    const baseItems = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window) || reduceMotion) {
        document.querySelectorAll('.reveal, .intro h1, .also .label, .also-item, .cta h2, .cta-links, .footer-inner, .spec-row li')
            .forEach((el) => el.classList.add('is-in'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    baseItems.forEach((el) => io.observe(el));

    // Additional elements and stagger groups
    const singles = ['.intro h1', '.also .label', '.cta h2', '.cta-links', '.footer-inner'];
    singles.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
                io.observe(el);
            }
        });
    });

    const groups = [
        { sel: '.also-item', gap: 0.08 },
        { sel: '.spec-row li', gap: 0.07 },
        { sel: '.senko-body > *', gap: 0.05 },
    ];
    groups.forEach(({ sel, gap }) => {
        document.querySelectorAll(sel).forEach((el, i) => {
            if (!el.classList.contains('reveal')) {
                el.style.transitionDelay = `${i * gap}s`;
                el.classList.add('reveal');
                io.observe(el);
            }
        });
    });
})();
