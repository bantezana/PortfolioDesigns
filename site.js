// Shared behavior for every page: nav border on scroll, scroll-reveal, back-to-top.
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

    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
        items.forEach((el) => el.classList.add('is-in'));
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
    items.forEach((el) => io.observe(el));
})();
