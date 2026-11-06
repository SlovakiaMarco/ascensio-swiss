if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const pageNavigation = performance.getEntriesByType('navigation')[0];

if (pageNavigation?.type === 'reload') {
    const resetScroll = () => window.scrollTo(0, 0);
    resetScroll();
    window.addEventListener('pageshow', resetScroll, { once: true });
}

const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// The preloader only plays on the first page of a session.
try {
    window.sessionStorage.setItem('as-intro', '1');
} catch (error) {
    // Storage can be unavailable (private mode, blocked cookies) – the site still works.
}

const MENU_ITEMS = [
    { number: '01', label: 'Hallenbau', hash: '#hallenbau' },
    { number: '02', label: 'Projekte', href: 'projekte.html' },
    { number: '03', label: 'Ablauf', hash: '#ablauf' },
    { number: '04', label: 'Über uns', href: 'ueber-uns.html' },
    { number: '05', label: 'Leistungen', hash: '#gewerke' },
    { number: '06', label: 'Kontakt', href: 'kontakt.html' }
];

document.addEventListener('alpine:init', () => {
    Alpine.data('site', () => ({
        modalOpen: false,
        init() {
            const inquiry = new URLSearchParams(window.location.search).get('anfrage');

            if (!inquiry) {
                return;
            }

            this.modalOpen = true;
            const projectField = document.querySelector('[name="project"]');

            if (projectField) {
                projectField.value = `Anfrage: ${inquiry}`;
            }
        },
        submitInquiry(event) {
            const formData = new FormData(event.currentTarget);
            const body = [
                `Name: ${formData.get('name')}`,
                `E-Mail: ${formData.get('email')}`,
                `Telefon: ${formData.get('phone')}`,
                '',
                `Projekt: ${formData.get('project') || '-'}`
            ].join('\n');

            window.location.href = `mailto:info@ascensioswiss.ch?subject=${encodeURIComponent('Hallenanfrage Ascensio Swiss')}&body=${encodeURIComponent(body)}`;
            this.modalOpen = false;
        }
    }));
});

/* --------------------------------------------------------------------------
   Header: background over the hero, hide on scroll down, show on scroll up
   -------------------------------------------------------------------------- */
function initHeader(header, hero) {
    if (!header) {
        return;
    }

    let lastScrollY = window.scrollY;

    const update = () => {
        const scrollY = window.scrollY;

        if (hero && header.classList.contains('section-nav')) {
            header.classList.toggle('is-over-hero', hero.getBoundingClientRect().bottom <= header.offsetHeight);
        }

        if (!root.classList.contains('menu-open')) {
            if (scrollY > lastScrollY + 6 && scrollY > 240) {
                header.classList.add('is-hidden');
            } else if (scrollY < lastScrollY - 6 || scrollY <= 240) {
                header.classList.remove('is-hidden');
            }
        }

        lastScrollY = scrollY;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}

/* --------------------------------------------------------------------------
   Smooth scrolling (Lenis) + anchor links with header offset
   -------------------------------------------------------------------------- */
function initSmoothScroll(header) {
    if (prefersReducedMotion || typeof Lenis === 'undefined') {
        return null;
    }

    const lenis = new Lenis({
        duration: 1.15,
        easing: (progress) => 1 - Math.pow(1 - progress, 4),
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1
    });
    const getScrollOffset = () => header?.classList.contains('section-nav') ? -header.offsetHeight - 16 : -24;

    const animateScroll = (time) => {
        lenis.raf(time);
        requestAnimationFrame(animateScroll);
    };
    requestAnimationFrame(animateScroll);

    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
    }

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');

        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const target = document.querySelector(link.getAttribute('href'));

        if (!target) {
            return;
        }

        event.preventDefault();
        history.pushState(null, '', link.getAttribute('href'));
        lenis.scrollTo(target, { offset: getScrollOffset(), duration: 1.15 });
    });

    window.addEventListener('popstate', () => {
        const target = window.location.hash && document.querySelector(window.location.hash);

        if (target) {
            lenis.scrollTo(target, { offset: getScrollOffset(), duration: 1.15 });
        }
    });

    return lenis;
}

/* --------------------------------------------------------------------------
   Mobile menu (hamburger)
   -------------------------------------------------------------------------- */
function initMobileMenu(lenis) {
    const toggle = document.querySelector('.nav-toggle');

    if (!toggle) {
        return;
    }

    const header = toggle.closest('.section-nav, .detail-topbar');
    const isHomepage = Boolean(document.querySelector('.hero-section'));
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const currentPage = currentFile === 'projekt.html' ? 'projekte.html' : currentFile;

    const links = MENU_ITEMS.map((item, index) => {
        const href = item.hash ? `${isHomepage ? '' : 'index.html'}${item.hash}` : item.href;
        const current = !item.hash && item.href === currentPage ? ' aria-current="page"' : '';

        return `<a href="${href}" style="--i:${index}"${current}>`
            + `<span class="mobile-menu-num">${item.number}</span>`
            + `<span class="mobile-menu-text">${item.label}</span>`
            + '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>';
    }).join('');

    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.id = 'mobile-menu';
    menu.setAttribute('data-lenis-prevent', '');
    menu.innerHTML = `
        <div class="mobile-menu-panel">
            <div class="mobile-menu-inner">
                <div>
                    <span class="mobile-menu-label">Navigation</span>
                    <nav class="mobile-menu-nav" aria-label="Mobile Navigation">${links}</nav>
                </div>
                <div class="mobile-menu-footer">
                    <div class="mobile-menu-contact">
                        <a href="tel:+41775205626"><i class="fa-solid fa-phone" aria-hidden="true"></i> +41 77 520 56 26</a>
                        <a href="mailto:info@ascensioswiss.ch"><i class="fa-solid fa-envelope" aria-hidden="true"></i> info@ascensioswiss.ch</a>
                        <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> 8132 Egg b. Zürich, Schweiz</span>
                    </div>
                    <a href="kontakt.html" class="btn btn--primary btn--invert">Projekt anfragen <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                </div>
            </div>
            <span class="hazard-strip" aria-hidden="true"></span>
        </div>`;
    document.body.append(menu);

    let isOpen = false;

    const setOpen = (open, { returnFocus = true } = {}) => {
        if (open === isOpen) {
            return;
        }

        isOpen = open;
        menu.classList.toggle('is-open', open);
        root.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');

        if (open) {
            header?.classList.remove('is-hidden');
            lenis?.stop();
            menu.querySelector('a[href]')?.focus({ preventScroll: true });
        } else {
            lenis?.start();

            if (returnFocus) {
                toggle.focus({ preventScroll: true });
            }
        }
    };

    toggle.addEventListener('click', () => setOpen(!isOpen));

    // Runs before the document-level handlers, so Lenis is running again
    // when the anchor handler scrolls to the target section.
    menu.addEventListener('click', (event) => {
        if (event.target.closest('a[href]')) {
            setOpen(false, { returnFocus: false });
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!isOpen) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            return;
        }

        if (event.key !== 'Tab') {
            return;
        }

        const focusable = [toggle, ...menu.querySelectorAll('a[href]')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!focusable.includes(document.activeElement)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    window.matchMedia('(min-width: 1200px)').addEventListener('change', (event) => {
        if (event.matches) {
            setOpen(false, { returnFocus: false });
        }
    });
}

/* --------------------------------------------------------------------------
   Page transitions: red panel covers the page, the next page reveals itself
   via the `wipe-in` class set by the inline script in <head>.
   -------------------------------------------------------------------------- */
function initPageTransitions() {
    if (prefersReducedMotion) {
        return;
    }

    let isLeaving = false;

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');

        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        if ((link.target && link.target !== '_self') || link.hasAttribute('download')) {
            return;
        }

        const url = new URL(link.href, window.location.href);

        if (!['http:', 'https:', 'file:'].includes(url.protocol) || url.origin !== window.location.origin) {
            return;
        }

        // Same document (anchor links) – handled by smooth scrolling.
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
        }

        event.preventDefault();

        if (isLeaving) {
            return;
        }

        isLeaving = true;

        try {
            window.sessionStorage.setItem('as-wipe', '1');
        } catch (error) {
            // Without storage the next page simply appears without the reveal.
        }

        const wipe = document.createElement('div');
        wipe.className = 'page-wipe';
        wipe.setAttribute('aria-hidden', 'true');
        wipe.textContent = 'Ascensio Swiss';
        document.body.append(wipe);

        let navigated = false;
        const navigate = () => {
            if (!navigated) {
                navigated = true;
                window.location.href = url.href;
            }
        };

        wipe.animate(
            [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
            { duration: 520, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', fill: 'forwards' }
        ).finished.then(navigate, navigate);
        window.setTimeout(navigate, 900);
    });

    // Back/forward cache: remove the cover when the page is restored.
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
            return;
        }

        isLeaving = false;
        root.classList.remove('wipe-in');
        document.querySelectorAll('.page-wipe').forEach((wipe) => wipe.remove());
    });
}

/* --------------------------------------------------------------------------
   Preloader (homepage, first visit per session)
   -------------------------------------------------------------------------- */
function runPreloader(lenis) {
    const preloader = document.querySelector('.preloader');

    if (!preloader || !root.classList.contains('preload')) {
        return 0;
    }

    lenis?.stop();

    const paths = preloader.querySelectorAll('.preloader-logo path');
    const counter = preloader.querySelector('.preloader-count');
    const progress = { value: 0 };

    gsap.timeline({
        onComplete: () => {
            root.classList.remove('preload');
            preloader.remove();
            lenis?.start();
        }
    })
        .to(paths, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.12 }, 0)
        .to(paths, { fill: '#d9232a', duration: 0.4, ease: 'power1.out' }, 0.95)
        .to(progress, {
            value: 100,
            duration: 1.3,
            ease: 'power2.inOut',
            onUpdate: () => {
                counter.textContent = String(Math.round(progress.value)).padStart(3, '0');
            }
        }, 0)
        .to(preloader.querySelector('.preloader-bar span'), { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
        .to(preloader.querySelector('.preloader-inner'), { autoAlpha: 0, y: -30, duration: 0.45, ease: 'power2.in' }, 1.45)
        .to(preloader.querySelector('.preloader-panel--dark'), { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, 1.7)
        .to(preloader.querySelector('.preloader-panel--red'), { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, 1.82);

    // The hero intro starts while the red panel is leaving.
    return 2.2;
}

/* --------------------------------------------------------------------------
   Animation helpers
   -------------------------------------------------------------------------- */
function animateHero(delay) {
    if (!document.querySelector('.hero-section')) {
        return;
    }

    gsap.timeline({ delay })
        .fromTo('.hero-video', { scale: 1.18 }, { scale: 1, duration: 2.4, ease: 'power3.out' }, 0)
        .fromTo('.hero-side-line', { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: 'power3.inOut', transformOrigin: 'top center' }, 0)
        .from('.hero-topline > *', { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.2)
        .from('.hero-hazard', { scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'power4.inOut' }, 0.35)
        .from('.hero-description, .hero-actions > *', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 0.75)
        .from('.hero-scroll', { y: 12, autoAlpha: 0, duration: 0.6, ease: 'power3.out' }, 1.2);

    gsap.to('.hero-video', {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8
        }
    });
}

function initHeadingWipes(pageDelay) {
    const headings = Array.from(document.querySelectorAll('.hero-title, h1, h2'))
        .filter((element) => !element.closest('.leader-card, .support-grid, .mobile-menu'));

    headings.forEach((element) => {
        element.classList.add('heading-wipe');
        const headingRect = element.getBoundingClientRect();
        const context = element.parentElement;
        const contextRect = context.getBoundingClientRect();
        const clipPad = parseFloat(window.getComputedStyle(element).fontSize) * 0.2;
        const lines = new Map();
        const textWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let textNode;

        while ((textNode = textWalker.nextNode())) {
            if (!textNode.textContent.trim()) {
                continue;
            }

            const range = document.createRange();
            range.selectNodeContents(textNode);

            Array.from(range.getClientRects()).forEach((rect) => {
                if (!rect.width || !rect.height) {
                    return;
                }

                const top = Math.round(rect.top);
                const line = lines.get(top) || {
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom,
                    target: element.matches('.hero-title')
                        ? textNode.parentElement.closest('.hero-title-line')?.firstElementChild
                        : null
                };
                line.left = Math.min(line.left, rect.left);
                line.right = Math.max(line.right, rect.right);
                line.top = Math.min(line.top, rect.top);
                line.bottom = Math.max(line.bottom, rect.bottom);
                lines.set(top, line);
            });
        }

        const textLines = Array.from(lines.values());

        if (textLines.length === 0) {
            element.classList.remove('heading-wipe');
            return;
        }

        context.classList.add('heading-wipe-context');
        const textStart = Math.min(...textLines.map((line) => line.left));
        const textEnd = Math.max(...textLines.map((line) => line.right));
        const isHeroTitle = element.matches('.hero-title');
        const bands = textLines.map((line) => {
            const band = document.createElement('span');
            const bandSize = line.bottom - line.top + 4;
            band.className = 'heading-wipe-band';
            band.setAttribute('aria-hidden', 'true');
            band.style.left = `${line.left - contextRect.left}px`;
            band.style.top = `${line.top - contextRect.top - 2}px`;
            band.style.width = `${bandSize}px`;
            band.style.height = `${bandSize}px`;
            context.append(band);
            return { element: band, line };
        });

        const reveal = { progress: 0 };
        const updateReveal = () => {
            const edge = textStart + (textEnd - textStart) * reveal.progress;
            const rightInset = Math.max(0, headingRect.right - edge);
            const bandScale = reveal.progress <= 0.5
                ? 0.04 + reveal.progress * 1.92
                : 1 - (reveal.progress - 0.5) * 2;

            if (!isHeroTitle) {
                element.style.clipPath = `inset(-${clipPad}px ${rightInset}px -${clipPad}px 0)`;
            }

            bands.forEach(({ element: band, line }) => {
                const lineEdge = isHeroTitle
                    ? line.left + (line.right - line.left) * reveal.progress
                    : Math.max(line.left, edge);

                if (line.target) {
                    line.target.style.clipPath = `inset(-${clipPad}px ${Math.max(0, line.target.getBoundingClientRect().right - lineEdge)}px -${clipPad}px 0)`;
                }

                band.style.transform = `translateX(${lineEdge - line.left}px) scaleX(${bandScale})`;
                band.style.opacity = reveal.progress < 1 && edge >= line.left ? '1' : '0';
            });
        };
        updateReveal();

        const startsInView = headingRect.top < window.innerHeight;

        gsap.timeline({
            delay: isHeroTitle ? pageDelay + 0.15 : (startsInView ? pageDelay : 0),
            onUpdate: updateReveal,
            onComplete: () => {
                element.style.removeProperty('clip-path');
                textLines.forEach((line) => line.target?.style.removeProperty('clip-path'));
                bands.forEach(({ element: band }) => band.remove());
                element.classList.remove('heading-wipe');
            },
            scrollTrigger: isHeroTitle ? undefined : {
                trigger: element,
                start: 'top 86%',
                once: true
            }
        }).to(reveal, {
            progress: 1,
            duration: 1.2,
            ease: 'power3.inOut'
        });
    });
}

function initCounters() {
    document.querySelectorAll('[data-count]').forEach((element) => {
        const target = Number(element.dataset.count);
        const digits = element.textContent.trim().length;
        const state = { value: 0 };
        const render = () => {
            element.textContent = String(Math.round(state.value)).padStart(digits, '0');
        };

        render();
        gsap.to(state, {
            value: target,
            duration: 2.2,
            ease: 'power3.out',
            onUpdate: render,
            scrollTrigger: {
                trigger: element,
                start: 'top 88%',
                once: true
            }
        });
    });

    const stats = gsap.utils.toArray('.stat');

    if (stats.length) {
        gsap.from(stats, {
            y: 40,
            autoAlpha: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.stats-grid',
                start: 'top 85%',
                once: true
            }
        });
    }
}

function initBlueprintDrawings() {
    document.querySelectorAll('.hall-card-visual svg, .detail-hero-blueprint svg').forEach((svg) => {
        const strokes = Array.from(svg.querySelectorAll('.drawing-main, .drawing-accent, .drawing-dimension'));
        const grid = svg.querySelector('.drawing-grid');

        strokes.forEach((path) => {
            const length = path.getTotalLength();
            gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, strokeLinecap: 'butt' });
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: svg,
                start: 'top 85%',
                once: true
            },
            onComplete: () => gsap.set(strokes, { clearProps: 'strokeDasharray,strokeDashoffset,strokeLinecap' })
        })
            .from(grid, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' })
            .to(strokes, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.25 }, 0.1);
    });
}

function initProcessTimeline() {
    const timeline = document.querySelector('.process-timeline');

    if (!timeline) {
        return;
    }

    const steps = Array.from(timeline.querySelectorAll('.process-step'));
    const state = { progress: 0 };
    const render = () => {
        timeline.style.setProperty('--progress', state.progress.toFixed(4));
        steps.forEach((step, index) => {
            step.classList.toggle('is-active', state.progress >= index / steps.length + 0.02);
        });
    };

    timeline.classList.add('is-animated');
    render();

    gsap.to(state, {
        progress: 1,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
            trigger: timeline,
            start: 'top 75%',
            end: 'bottom 50%',
            scrub: 0.8
        }
    });

    const word = document.querySelector('.process-bg-word');

    if (word) {
        gsap.fromTo(word, { xPercent: 8 }, {
            xPercent: -30,
            ease: 'none',
            scrollTrigger: {
                trigger: '.process-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    }
}

function initParallax() {
    gsap.utils.toArray('[data-parallax]').forEach((element) => {
        const amount = Number(element.dataset.parallax) || 6;

        gsap.fromTo(element, { yPercent: -amount }, {
            yPercent: amount,
            ease: 'none',
            scrollTrigger: {
                trigger: element.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });
}

function initRedWipes() {
    gsap.utils.toArray('.project-card-media, .collage-item, .about-photo, .values-media').forEach((media) => {
        const wipe = document.createElement('span');
        wipe.className = 'project-card-red-wipe';
        wipe.setAttribute('aria-hidden', 'true');
        media.append(wipe);

        gsap.to(wipe, {
            scaleX: 0,
            duration: 1,
            ease: 'power3.inOut',
            transformOrigin: 'right center',
            onComplete: () => wipe.remove(),
            scrollTrigger: {
                trigger: media,
                start: 'top 88%',
                once: true
            }
        });
    });
}

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.append(bar);

    gsap.to(bar, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
            start: 0,
            end: 'max',
            scrub: 0.3
        }
    });
}

function initMarquee(lenis) {
    const track = document.querySelector('.marquee-track');

    if (!track || !lenis || typeof track.getAnimations !== 'function') {
        return;
    }

    const [animation] = track.getAnimations();

    if (!animation) {
        return;
    }

    // Scrolling speeds the band up and scrolling upwards reverses it.
    let direction = 1;
    let target = 1;
    let current = 1;

    lenis.on('scroll', ({ velocity, direction: scrollDirection }) => {
        if (scrollDirection) {
            direction = scrollDirection;
        }

        target = direction * (1 + Math.min(Math.abs(velocity) * 0.12, 5));
    });

    gsap.ticker.add(() => {
        target += (direction - target) * 0.04;
        const next = current + (target - current) * 0.12;

        if (Math.abs(next - current) > 0.001) {
            current = next;
            animation.playbackRate = current;
        }
    });
}

function initCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor is-hidden';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor-ring"><span class="cursor-label"></span></span>';
    document.body.append(cursor);

    document.querySelectorAll('.project-card, .collage-item').forEach((element) => {
        element.dataset.cursor = 'Ansehen';
    });
    document.querySelectorAll('.hall-card-link').forEach((element) => {
        element.dataset.cursor = 'Entdecken';
    });

    const label = cursor.querySelector('.cursor-label');
    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
    let hasPosition = false;

    window.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') {
            return;
        }

        if (!hasPosition) {
            gsap.set(cursor, { x: event.clientX, y: event.clientY });
            hasPosition = true;
        }

        cursor.classList.remove('is-hidden');
        moveX(event.clientX);
        moveY(event.clientY);
    }, { passive: true });

    document.addEventListener('mouseover', (event) => {
        const labelled = event.target.closest('[data-cursor]');
        const interactive = event.target.closest('a, button, label, input, select, textarea');

        cursor.classList.toggle('has-label', Boolean(labelled));
        cursor.classList.toggle('is-hover', Boolean(interactive) && !labelled);

        if (labelled) {
            label.textContent = labelled.dataset.cursor;
        }
    });

    document.documentElement.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
}

function initMagnetic() {
    document.querySelectorAll('.btn, .detail-button, .detail-top-cta, .nav-toggle').forEach((element) => {
        const moveX = gsap.quickTo(element, 'x', { duration: 0.5, ease: 'power3' });
        const moveY = gsap.quickTo(element, 'y', { duration: 0.5, ease: 'power3' });

        element.addEventListener('pointermove', (event) => {
            if (event.pointerType !== 'mouse') {
                return;
            }

            const rect = element.getBoundingClientRect();
            moveX((event.clientX - (rect.left + rect.width / 2)) * 0.25);
            moveY((event.clientY - (rect.top + rect.height / 2)) * 0.35);
        });

        element.addEventListener('pointerleave', () => {
            moveX(0);
            moveY(0);
        });
    });
}

function initTilt() {
    document.querySelectorAll('.hall-card').forEach((card) => {
        let rotateX;
        let rotateY;
        let lift;

        const ensureTweens = () => {
            if (rotateX) {
                return;
            }

            // GSAP drives the transform from now on – a CSS transform transition would fight it.
            card.style.transition = 'border-color 300ms ease, box-shadow 400ms ease';
            gsap.set(card, { transformPerspective: 900 });
            rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
            rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
            lift = gsap.quickTo(card, 'y', { duration: 0.6, ease: 'power3' });
        };

        card.addEventListener('pointermove', (event) => {
            if (event.pointerType !== 'mouse') {
                return;
            }

            ensureTweens();
            const rect = card.getBoundingClientRect();
            const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
            const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
            rotateY(offsetX * 8);
            rotateX(offsetY * -8);
            lift(-6);
        });

        card.addEventListener('pointerleave', () => {
            if (!rotateX) {
                return;
            }

            rotateX(0);
            rotateY(0);
            lift(0);
        });
    });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    const homepageHero = document.querySelector('.hero-section');
    const header = document.querySelector('.section-nav, .detail-topbar');

    initHeader(header, homepageHero);

    const projectNumber = new URLSearchParams(window.location.search).get('projekt');
    const projectNumberLabel = document.querySelector('[data-project-number]');
    const projectTitle = document.querySelector('[data-project-title]');
    const projectImage = document.querySelector('[data-project-image]');

    if (projectNumberLabel && projectTitle && projectImage) {
        const safeNumber = /^(0[1-9]|1[01])$/.test(projectNumber || '') ? projectNumber : '01';
        projectNumberLabel.textContent = safeNumber;
        projectTitle.textContent = `Projekt ${safeNumber}`;
        projectImage.src = `assets/projekte/projekt-${safeNumber}.jpg`;
        projectImage.alt = `Referenzfoto ${safeNumber}`;
        document.title = `Projekt ${safeNumber} | Ascensio Swiss`;
    }

    document.addEventListener('submit', (event) => {
        const form = event.target;

        if (!(form instanceof HTMLFormElement) || !form.matches('[data-email-form]')) {
            return;
        }

        event.preventDefault();
        const formData = new FormData(form);
        const body = [
            `Name / Unternehmen: ${formData.get('name')}`,
            `E-Mail: ${formData.get('email')}`,
            `Telefon: ${formData.get('phone') || '-'}`,
            `Thema: ${formData.get('type')}`,
            '',
            `Nachricht: ${formData.get('message')}`
        ].join('\n');

        window.location.href = `mailto:info@ascensioswiss.ch?subject=${encodeURIComponent('Projektanfrage Ascensio Swiss')}&body=${encodeURIComponent(body)}`;
    });

    const smoothScroll = initSmoothScroll(header);
    initMobileMenu(smoothScroll);
    initPageTransitions();

    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        root.classList.remove('preload');
        return;
    }

    // Wait for the web fonts (headline measurements depend on them), but never block for long.
    await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, 2000))
    ]);
    gsap.registerPlugin(ScrollTrigger);

    const preloaderDuration = runPreloader(smoothScroll);
    const pageDelay = preloaderDuration || (root.classList.contains('wipe-in') ? 0.55 : 0.05);

    animateHero(pageDelay);

    const detailHero = document.querySelector('.detail-hero');

    if (detailHero) {
        gsap.from('.detail-hero-copy > *', {
            y: 24,
            duration: 0.8,
            delay: pageDelay,
            stagger: 0.12,
            ease: 'power3.out'
        });

        gsap.to('.detail-hero-image', {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: {
                trigger: detailHero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.8
            }
        });
    }

    gsap.utils.toArray('.section-eyebrow').forEach((eyebrow) => {
        if (eyebrow.closest('.mobile-menu')) {
            return;
        }

        gsap.fromTo(eyebrow, {
            autoAlpha: 0,
            x: -12,
            '--eyebrow-line-progress': 0
        }, {
            autoAlpha: 1,
            x: 0,
            '--eyebrow-line-progress': 1,
            duration: 0.75,
            delay: eyebrow.getBoundingClientRect().top < window.innerHeight ? pageDelay : 0,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: eyebrow,
                start: 'top 90%',
                once: true
            }
        });
    });

    initHeadingWipes(pageDelay);

    gsap.utils.toArray([
        '.page-heading > p',
        '.editorial-heading > p',
        '.projects-copy > p',
        '.about-copy > p',
        '.detail-info-heading > p',
        '.detail-cta > div > p',
        '.leadership-heading > p',
        '.about-story-copy > p',
        '.secondary-services-copy > p',
        '.project-detail-copy > p',
        '.project-detail-lead > p',
        '.values-copy > p',
        '.contact-details > p',
        '.footer-lead-text'
    ].join(', ')).forEach((element) => {
        gsap.from(element, {
            y: 18,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 88%',
                once: true
            }
        });
    });

    gsap.utils.toArray([
        '.project-grid',
        '.hall-grid',
        '.process-list',
        '.detail-info-grid',
        '.detail-steps',
        '.support-grid',
        '.leadership-grid',
        '.service-list',
        '.why-grid',
        '.values-list'
    ].join(', ')).forEach((container) => {
        const cards = Array.from(container.children).filter((element) =>
            element.matches('.project-card, .hall-card-link, .process-step, .detail-info-card, li, article')
        );

        if (cards.length === 0) {
            return;
        }

        // Cards have CSS transform transitions (hover lift). While GSAP animates the
        // entrance, those transitions are disabled; explicit end values plus clearProps
        // guarantee the cards never stay offset (which made them overlap content below).
        cards.forEach((card) => card.classList.add('is-gsap-animating'));

        gsap.fromTo(cards, {
            y: 28,
            rotateX: 2,
            transformPerspective: 900
        }, {
            y: 0,
            rotateX: 0,
            duration: 0.8,
            stagger: 0.09,
            ease: 'power3.out',
            clearProps: 'transform',
            onComplete: () => cards.forEach((card) => card.classList.remove('is-gsap-animating')),
            scrollTrigger: {
                trigger: container,
                start: 'top 86%',
                once: true
            }
        });
    });

    gsap.utils.toArray([
        '.project-card-image',
        '.project-detail-media',
        '.about-story-image',
        '.detail-hero-image'
    ].join(', ')).forEach((image) => {
        gsap.fromTo(image, {
            clipPath: 'inset(0 100% 0 0)'
        }, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 1.1,
            ease: 'power2.inOut',
            scrollTrigger: {
                trigger: image,
                start: 'top 88%',
                once: true
            }
        });
    });

    initRedWipes();

    gsap.utils.toArray([
        '.hall-section-cta',
        '.about-facts',
        '.detail-cta',
        '.contact-form',
        '.detail-footer',
        '.footer-contact-links',
        '.direct-contact'
    ].join(', ')).forEach((element) => {
        gsap.from(element, {
            y: 20,
            autoAlpha: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 92%',
                once: true
            }
        });
    });

    const aboutFocus = document.querySelector('.about-focus');

    if (aboutFocus) {
        gsap.from(aboutFocus, {
            x: -40,
            autoAlpha: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: aboutFocus,
                start: 'top 90%',
                once: true
            }
        });
    }

    gsap.utils.toArray('.detail-nav a, .section-nav a, .nav-toggle').forEach((link, index) => {
        gsap.from(link, {
            y: -10,
            autoAlpha: 0,
            duration: 0.55,
            delay: pageDelay + index * 0.06,
            ease: 'power3.out'
        });
    });

    initCounters();
    initBlueprintDrawings();
    initProcessTimeline();
    initParallax();
    initScrollProgress();
    initMarquee(smoothScroll);

    if (hasFinePointer) {
        initCursor();
        initMagnetic();
        initTilt();
    }

    ScrollTrigger.refresh();
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
});
