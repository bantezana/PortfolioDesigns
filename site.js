(function () {
    const nav = document.querySelector('.site-nav');
    const backToTop = document.querySelector('.back-to-top');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Nav scroll ----------
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

    // ---------- Hero word reveal ----------
    // Split h1 words into clip containers so each word rises from behind a mask.
    // Runs before the IO setup so the DOM is ready for the observer to ignore it.
    (function () {
        const h1 = document.querySelector('.intro h1');
        if (!h1) return;

        const nodes = [...h1.childNodes];
        h1.innerHTML = '';
        h1.classList.add('hero-split');

        let idx = 0;

        function addWord(word, isAccent) {
            const outer = document.createElement('span');
            outer.className = 'hw' + (isAccent ? ' hw-a' : '');
            const inner = document.createElement('span');
            inner.className = 'hw-i';
            inner.textContent = word;
            if (!reduceMotion) inner.style.setProperty('--d', (0.05 + idx * 0.07) + 's');
            outer.appendChild(inner);
            h1.appendChild(outer);
            h1.appendChild(document.createTextNode(' '));
            idx++;
        }

        nodes.forEach(node => {
            if (node.nodeType === 3) {
                node.textContent.trim().split(/\s+/).filter(Boolean).forEach(w => addWord(w, false));
            } else if (node.nodeType === 1) {
                node.textContent.trim().split(/\s+/).filter(Boolean).forEach(w => addWord(w, true));
            }
        });
    })();

    // ---------- Scroll reveals ----------
    document.querySelectorAll('.case-card').forEach((el, i) => {
        el.style.transitionDelay = (i * 0.1) + 's';
    });

    const baseItems = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window) || reduceMotion) {
        document.querySelectorAll('.reveal, .also .label, .also-item, .cta h2, .cta-links, .footer-inner, .spec-row li')
            .forEach(el => el.classList.add('is-in'));
        return;
    }

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    baseItems.forEach(el => io.observe(el));

    ['.also .label', '.cta h2', '.cta-links', '.footer-inner'].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (!el.classList.contains('reveal')) { el.classList.add('reveal'); io.observe(el); }
        });
    });

    [
        { sel: '.also-item',    gap: 0.08 },
        { sel: '.spec-row li',  gap: 0.07 },
        { sel: '.senko-body > *', gap: 0.05 },
    ].forEach(({ sel, gap }) => {
        document.querySelectorAll(sel).forEach((el, i) => {
            if (!el.classList.contains('reveal')) {
                el.style.transitionDelay = (i * gap) + 's';
                el.classList.add('reveal');
                io.observe(el);
            }
        });
    });

    // ---------- Spec number counters ----------
    // Animates "$149+" → counts from 0, "<3s" same, "3" same.
    (function () {
        if (reduceMotion) return;
        const io2 = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                io2.unobserve(entry.target);
                const el = entry.target;
                const orig = el.textContent;
                const m = orig.match(/[\d.]+/);
                if (!m) return;
                const num = parseFloat(m[0]);
                const pre = orig.slice(0, m.index);
                const suf = orig.slice(m.index + m[0].length);
                const isFloat = m[0].includes('.');
                const dur = 1100;
                let t0 = null;
                requestAnimationFrame(function tick(ts) {
                    if (!t0) t0 = ts;
                    const p = Math.min((ts - t0) / dur, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    el.textContent = pre + (isFloat ? (num * ease).toFixed(1) : Math.round(num * ease)) + suf;
                    if (p < 1) requestAnimationFrame(tick);
                    else el.textContent = orig;
                });
            });
        }, { threshold: 0.6 });
        document.querySelectorAll('.spec-row strong').forEach(el => io2.observe(el));
    })();

    // ---------- Card cursor ----------
    // A lerp-tracked circle that trails the pointer on project cards.
    (function () {
        const cards = document.querySelectorAll('.case-card, .senko-card');
        if (!cards.length) return;

        const cursor = document.createElement('div');
        cursor.className = 'card-cursor';
        cursor.innerHTML = '<span></span>';
        document.body.appendChild(cursor);
        document.body.classList.add('has-card-cursor');

        let tx = -300, ty = -300, cx = -300, cy = -300, ts = 0, cs = 0;
        const lerp = (a, b, t) => a + (b - a) * t;

        (function tick() {
            cx = lerp(cx, tx, 0.12);
            cy = lerp(cy, ty, 0.12);
            cs = lerp(cs, ts, 0.18);
            cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%) scale(' + cs + ')';
            requestAnimationFrame(tick);
        })();

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                ts = 1;
                cursor.querySelector('span').textContent = card.classList.contains('senko-card') ? 'Open →' : 'View →';
            });
            card.addEventListener('mouseleave', () => { ts = 0; });
            card.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
        });
    })();

    // ---------- Card perspective tilt ----------
    (function () {
        if (reduceMotion) return;
        document.querySelectorAll('.case-card, .senko-card').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width  - 0.5) * 5;
                const y = ((e.clientY - r.top)  / r.height - 0.5) * -3;
                card.style.transition = 'transform 0.08s linear';
                card.style.setProperty('--rx', y + 'deg');
                card.style.setProperty('--ry', x + 'deg');
            });
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    })();

    // ---------- Magnetic CTAs ----------
    (function () {
        if (reduceMotion) return;
        document.querySelectorAll('.btn-primary').forEach(btn => {
            let frame;
            btn.addEventListener('mousemove', e => {
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(() => {
                    const r = btn.getBoundingClientRect();
                    const x = ((e.clientX - r.left) / r.width  - 0.5) * 12;
                    const y = ((e.clientY - r.top)  / r.height - 0.5) *  7;
                    btn.style.transform = 'translate(' + x + 'px,' + y + 'px) translateY(-1px)';
                });
            });
            btn.addEventListener('mouseleave', () => {
                cancelAnimationFrame(frame);
                btn.style.transform = '';
            });
        });
    })();

    // ---------- Page transitions ----------
    (function () {
        if (!document.startViewTransition || reduceMotion) return;
        document.addEventListener('click', e => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('//') || e.metaKey || e.ctrlKey || e.shiftKey) return;
            e.preventDefault();
            const dest = href;
            document.startViewTransition(() => { window.location.href = dest; });
        });
    })();
})();
