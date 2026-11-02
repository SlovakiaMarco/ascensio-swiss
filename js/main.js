if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const pageNavigation = performance.getEntriesByType('navigation')[0];

if (pageNavigation?.type === 'reload') {
    const resetScroll = () => window.scrollTo(0, 0);
    resetScroll();
    window.addEventListener('pageshow', resetScroll, { once: true });
}

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

document.addEventListener('DOMContentLoaded', async () => {
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

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let smoothScroll;

    if (!reducedMotion && typeof Lenis !== 'undefined') {
        smoothScroll = new Lenis({
            duration: 1.15,
            easing: (progress) => 1 - Math.pow(1 - progress, 4),
            smoothWheel: true,
            wheelMultiplier: 0.85,
            touchMultiplier: 1
        });

        const animateScroll = (time) => {
            smoothScroll.raf(time);
            requestAnimationFrame(animateScroll);
        };
        requestAnimationFrame(animateScroll);

        if (typeof ScrollTrigger !== 'undefined') {
            smoothScroll.on('scroll', ScrollTrigger.update);
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
            smoothScroll.scrollTo(target, { offset: -24, duration: 1.15 });
        });

        window.addEventListener('popstate', () => {
            const target = window.location.hash && document.querySelector(window.location.hash);

            if (target) {
                smoothScroll.scrollTo(target, { offset: -24, duration: 1.15 });
            }
        });
    }

    if (reducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    await document.fonts.ready;
    gsap.registerPlugin(ScrollTrigger);

    const homepageHero = document.querySelector('.hero-section');
    const detailHero = document.querySelector('.detail-hero');

    if (homepageHero) {
        gsap.fromTo('.hero-side-line', {
            scaleY: 0
        }, {
            scaleY: 1,
            duration: 1.1,
            ease: 'power3.inOut',
            transformOrigin: 'top center'
        });

        gsap.from('.hero-kicker, .hero-description, .hero-actions, .hero-stats', {
            y: 18,
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out'
        });

        gsap.to('.hero-video', {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
                trigger: homepageHero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.8
            }
        });
    }

    if (detailHero) {
        gsap.from('.detail-hero-copy > *', {
            y: 24,
            duration: 0.8,
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
        gsap.fromTo(eyebrow, {
            autoAlpha: 0,
            x: -12,
            '--eyebrow-line-progress': 0
        }, {
            autoAlpha: 1,
            x: 0,
            '--eyebrow-line-progress': 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: eyebrow,
                start: 'top 90%',
                once: true
            }
        });
    });

    const headingSelector = [
        '.hero-title',
        'h1',
        'h2'
    ].join(', ');
    const headings = Array.from(document.querySelectorAll(headingSelector))
        .filter((element) => !element.closest('.leader-card, .support-grid'));

    headings.forEach((element) => {
        element.classList.add('heading-wipe');
        const headingRect = element.getBoundingClientRect();
        const context = element.parentElement;
        const contextRect = context.getBoundingClientRect();
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
            return { element: band, line, bandSize };
        });

        const reveal = { progress: 0 };
        const updateReveal = () => {
            const edge = textStart + (textEnd - textStart) * reveal.progress;
            const rightInset = Math.max(0, headingRect.right - edge);
            const bandScale = reveal.progress <= 0.5
                ? 0.04 + reveal.progress * 1.92
                : 1 - (reveal.progress - 0.5) * 2;
            if (!isHeroTitle) {
                element.style.clipPath = `inset(-2px ${rightInset}px -2px 0)`;
            }

            bands.forEach(({ element: band, line }) => {
                const lineEdge = isHeroTitle
                    ? line.left + (line.right - line.left) * reveal.progress
                    : Math.max(line.left, edge);
                if (line.target) {
                    line.target.style.clipPath = `inset(-2px ${Math.max(0, line.target.getBoundingClientRect().right - lineEdge)}px -2px 0)`;
                }
                band.style.transform = `translateX(${lineEdge - line.left}px) scaleX(${bandScale})`;
                band.style.opacity = reveal.progress < 1 && edge >= line.left ? '1' : '0';
            });
        };
        updateReveal();

        const animation = gsap.timeline({
            onUpdate: updateReveal,
            onComplete: () => {
                element.style.removeProperty('clip-path');
                textLines.forEach((line) => line.target?.style.removeProperty('clip-path'));
                bands.forEach(({ element: band }) => band.remove());
                element.classList.remove('heading-wipe');
            },
            scrollTrigger: element.matches('.hero-title') ? undefined : {
                trigger: element,
                start: 'top 86%',
                once: true
            }
        });
        animation
            .to(reveal, {
                progress: 1,
                duration: 1.2,
                ease: 'power3.inOut'
            });
    });

    gsap.utils.toArray([
        '.page-heading > p',
        '.editorial-heading > p',
        '.projects-teaser-copy > p',
        '.detail-info-heading > p',
        '.detail-cta > div > p',
        '.leadership-heading > p',
        '.about-story-copy > p',
        '.secondary-services-copy > p',
        '.project-detail-copy > p',
        '.project-detail-lead > p',
        '.contact-details > p'
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
        '#hallenbau .grid',
        '.process-list',
        '.detail-info-grid',
        '.detail-steps',
        '.support-grid',
        '.leadership-grid'
    ].join(', ')).forEach((container) => {
        const cards = Array.from(container.children).filter((element) =>
            element.matches('.project-card, .hall-card-link, .process-step, .detail-info-card, li, article')
        );

        if (cards.length === 0) {
            return;
        }

        gsap.from(cards, {
            y: 28,
            rotateX: 2,
            transformPerspective: 900,
            duration: 0.8,
            stagger: 0.09,
            ease: 'power3.out',
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

    gsap.utils.toArray('.project-card-media').forEach((media) => {
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

    gsap.utils.toArray([
        '.hero-bottom',
        '.hall-section-cta',
        '.detail-cta',
        '.contact-form',
        '.detail-footer'
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

    gsap.utils.toArray('.detail-nav a, .section-nav a').forEach((link, index) => {
        gsap.from(link, {
            y: -10,
            duration: 0.55,
            delay: index * 0.06,
            ease: 'power3.out'
        });
    });

    ScrollTrigger.refresh();
});
