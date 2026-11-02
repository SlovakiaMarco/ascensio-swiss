document.addEventListener('alpine:init', () => {
    Alpine.data('site', () => ({
        modalOpen: false,
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

    Alpine.data('hallConfigurator', () => ({
        type: 'Betonskelettbau',
        area: 1200,
        crane: true,
        tzb: true,
        office: false
    }));
});

document.addEventListener('DOMContentLoaded', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const isReload = navigation && navigation.type === 'reload';

    if (isReload) {
        history.scrollRestoration = 'manual';

        if (window.location.hash) {
            history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }

        window.scrollTo(0, 0);
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let smoothScroll;

    window.addEventListener('load', () => {
        if (isReload) {
            smoothScroll ? smoothScroll.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
        }
    }, { once: true });

    if (reducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (typeof Lenis !== 'undefined') {
        smoothScroll = new Lenis({
            duration: 1.28,
            smoothWheel: true,
            wheelMultiplier: 0.9,
            prevent: (node) => Boolean(node.closest('.overflow-y-auto'))
        });

        smoothScroll.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => smoothScroll.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    if (smoothScroll) {
        const scrollToHash = (hash) => {
            const target = hash && hash !== '#'
                ? document.getElementById(decodeURIComponent(hash.slice(1)))
                : null;

            const destination = target
                ? window.scrollY + target.getBoundingClientRect().top - 24
                : 0;

            smoothScroll.scrollTo(destination, { duration: 1.5 });
        };

        document.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            const link = event.target.closest('a[href^="#"]');

            if (!link) {
                return;
            }

            const hash = link.getAttribute('href');
            const targetExists = hash === '#' || document.getElementById(decodeURIComponent(hash.slice(1)));

            if (!targetExists) {
                return;
            }

            event.preventDefault();

            const nextUrl = hash === '#'
                ? `${window.location.pathname}${window.location.search}`
                : hash;

            if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
                history.pushState(null, '', nextUrl);
            }

            scrollToHash(hash);
        });

        window.addEventListener('popstate', () => scrollToHash(window.location.hash));
    }

    const addTextReveal = (element) => {
        const block = document.createElement('span');
        block.className = 'text-reveal-block';
        block.setAttribute('aria-hidden', 'true');
        element.classList.add('text-reveal-target');
        element.append(block);
        return block;
    };

    const intro = gsap.timeline({
        delay: 1.5,
        defaults: { ease: 'power3.out' }
    });
    intro.from('.hero-kicker', {
        y: 10,
        autoAlpha: 0,
        duration: 0.4
    });
    intro.from('.hero-title-line > span', {
        yPercent: 110,
        duration: 0.74,
        stagger: 0.09
    }, '-=0.12');
    intro.from('.hero-description, .hero-actions, .hero-stats', {
        y: 14,
        autoAlpha: 0,
        duration: 0.52,
        stagger: 0.09
    }, '-=0.25');

    const heroTextBlocks = gsap.utils.toArray(
        '.hero-title-line > span, .hero-description, .hero-actions a span'
    ).map(addTextReveal);

    intro.fromTo(heroTextBlocks, {
        scaleX: 1
    }, {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: 0.36,
        stagger: 0.05,
        ease: 'power2.inOut'
    }, '-=0.5');

    gsap.fromTo('.hero-media img', {
        scale: 1.14,
        yPercent: -3
    }, {
        scale: 1.04,
        yPercent: 5,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });

    const revealGroups = [
        { selector: '#hallenbau .editorial-heading', trigger: '#hallenbau' },
        { selector: '#ablauf .editorial-heading, #ablauf .process-step', trigger: '#ablauf', stagger: 0.1 },
        { selector: '#konfigurator .max-w-4xl > .bg-swiss-panel', trigger: '#konfigurator' },
        { selector: '#ueber-uns .grid > div', trigger: '#ueber-uns', stagger: 0.14 },
        { selector: '#gewerke .secondary-services-copy, #gewerke .service-list', trigger: '#gewerke', stagger: 0.1 },
        { selector: '#kontakt .footer-lead, #kontakt .grid > div', trigger: '#kontakt', stagger: 0.1 }
    ];

    const textRevealGroups = [
        {
            selector: '#hallenbau .editorial-heading h2',
            trigger: '#hallenbau'
        },
        {
            selector: '#ueber-uns h2',
            trigger: '#ueber-uns'
        },
        {
            selector: '#gewerke h2',
            trigger: '#gewerke'
        }
    ];

    const sectionHeadings = gsap.utils.toArray(
        '#hallenbau .editorial-heading h2, #ueber-uns h2, #gewerke h2'
    );

    sectionHeadings.forEach((heading) => {
        const line = document.createElement('span');
        line.className = 'heading-draft-line';
        line.setAttribute('aria-hidden', 'true');
        heading.insertAdjacentElement('afterend', line);

        gsap.fromTo(line, {
            scaleX: 0
        }, {
            scaleX: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: heading,
                start: 'top 80%',
                once: true
            }
        });
    });

    textRevealGroups.forEach(({ selector, trigger }) => {
        const blocks = gsap.utils.toArray(selector)
            .filter((element) => element.getClientRects().length)
            .map(addTextReveal);

        if (!blocks.length) {
            return;
        }

        gsap.fromTo(blocks, {
            scaleX: 1
        }, {
            scaleX: 0,
            transformOrigin: 'right center',
            duration: 0.68,
            stagger: 0.07,
            ease: 'power2.inOut',
            scrollTrigger: {
                trigger,
                start: 'top 78%',
                once: true
            }
        });
    });

    revealGroups.forEach(({ selector, trigger, stagger = 0 }) => {
        const elements = gsap.utils.toArray(selector);

        if (!elements.length) {
            return;
        }

        gsap.fromTo(elements, {
            y: 24,
            autoAlpha: 0
        }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger,
            ease: 'power2.out',
            scrollTrigger: {
                trigger,
                start: 'top 82%',
                once: true
            }
        });
    });

    gsap.utils.toArray('.hall-card').forEach((card, index) => {
        const image = card.querySelector('.hall-card-media img');

        if (!image) {
            return;
        }

        const reveal = gsap.timeline({
            scrollTrigger: {
                trigger: card,
                start: 'top 84%',
                once: true
            },
            onComplete: () => gsap.set(card, { clearProps: 'transform' })
        });

        reveal.fromTo(card, {
            y: 24,
            autoAlpha: 0
        }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.52,
            ease: 'power3.out'
        }, index * 0.12);

        reveal.fromTo(image, {
            clipPath: 'inset(0 100% 0 0)',
            scale: 1.16
        }, {
            clipPath: 'inset(0 0% 0 0)',
            scale: 1,
            duration: 0.68,
            ease: 'power3.inOut'
        }, '-=0.08');
    });

    gsap.utils.toArray('#ueber-uns img').forEach((image) => {
        gsap.fromTo(image, {
            scale: 1.12,
            yPercent: -3
        }, {
            scale: 1,
            yPercent: 3,
            ease: 'none',
            scrollTrigger: {
                trigger: image,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });

    const progress = document.querySelector('#scroll-progress');

    if (progress) {
        ScrollTrigger.create({
            start: 0,
            end: () => ScrollTrigger.maxScroll(window),
            onUpdate: (trigger) => gsap.set(progress, { scaleX: trigger.progress })
        });
    }

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
});
