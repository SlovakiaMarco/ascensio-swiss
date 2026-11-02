document.addEventListener('alpine:init', () => {
    // Interaktívny konfigurátor hál
    Alpine.data('hallConfigurator', () => ({
        type: 'Betonskelettbau',
        area: 1200,
        crane: true,
        tzb: true,
        office: false
    }));
});

// GSAP animácie pri vstupe do stránky a pri scrollovaní
document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.hero-copy > *', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12
    });
    intro.from('.hero-visual', {
        x: 36,
        opacity: 0,
        duration: 0.9
    }, '-=0.55');

    gsap.to('.hero-visual', {
        y: -8,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1
    });

    const revealGroups = [
        { selector: '#hallenbau .text-center.max-w-3xl', trigger: '#hallenbau' },
        { selector: '#hallenbau .group', trigger: '#hallenbau', stagger: 0.16 },
        { selector: '#konfigurator .max-w-4xl', trigger: '#konfigurator' },
        { selector: '#ueber-uns .grid > div', trigger: '#ueber-uns', stagger: 0.14 },
        { selector: '#gewerke .mb-12, #gewerke .bg-white', trigger: '#gewerke', stagger: 0.14 },
        { selector: '#kontakt .grid > div', trigger: '#kontakt', stagger: 0.1 }
    ];

    revealGroups.forEach(({ selector, trigger, stagger = 0 }) => {
        gsap.fromTo(selector, {
            y: 28,
            opacity: 0
        }, {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger,
            ease: 'power2.out',
            scrollTrigger: {
                trigger,
                start: 'top 82%',
                once: true
            }
        });
    });
});
