document.addEventListener('DOMContentLoaded', () => {
    
    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // ============================================
    // BGM — PERSONA 5 BACKGROUND MUSIC
    // ============================================
    const bgm        = document.getElementById('bgm');
    const bgmBtn     = document.getElementById('bgm-toggle-btn');
    const bgmIcon    = document.getElementById('bgm-icon');
    const toastEl    = document.getElementById('copyright-toast');

    bgm.volume = 0.35; // Comfortable background level
    let bgmMuted = false;

    /** Show the copyright toast with GSAP slide + fade */
    function showCopyrightToast() {
        gsap.fromTo(toastEl,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0,
                duration: 0.6,
                ease: 'power3.out',
                onComplete: () => {
                    // Hold for 4 seconds then fade out
                    gsap.to(toastEl, {
                        opacity: 0,
                        y: -10,
                        duration: 0.5,
                        delay: 4,
                        ease: 'power2.in'
                    });
                }
            }
        );
    }

    /** Attempt autoplay. If blocked by browser policy,
     *  unlock on first user gesture instead.           */
    function startBGM() {
        bgm.play()
            .then(() => {
                showCopyrightToast();
                updateBgmBtn(false);
            })
            .catch(() => {
                // Browser blocked autoplay — wait for first interaction
                const unlock = () => {
                    bgm.play().then(() => {
                        showCopyrightToast();
                        updateBgmBtn(false);
                    }).catch(() => {});
                    document.removeEventListener('click',     unlock);
                    document.removeEventListener('keydown',   unlock);
                    document.removeEventListener('touchstart', unlock);
                };
                document.addEventListener('click',     unlock, { once: true });
                document.addEventListener('keydown',   unlock, { once: true });
                document.addEventListener('touchstart', unlock, { once: true });
            });
    }

    /** Update button label based on mute state */
    function updateBgmBtn(muted) {
        if (muted) {
            bgmIcon.textContent = '✕ BGM';
            bgmBtn.classList.add('bgm-muted');
        } else {
            bgmIcon.textContent = '♪ BGM';
            bgmBtn.classList.remove('bgm-muted');
        }
    }

    // Toggle mute/unmute
    bgmBtn?.addEventListener('click', () => {
        bgmMuted = !bgmMuted;
        bgm.muted = bgmMuted;
        updateBgmBtn(bgmMuted);
    });

    // Boot the BGM
    startBGM();

    // ============================================
    // PERSONA SOUND ENGINE
    // ============================================
    const hoverSoundSrc    = 'assets/persona_4_rematch.mp3';
    const selectSoundSrc   = 'assets/persona_5_selection.mp3';

    // Pre-load audio objects (clone trick for rapid re-trigger)
    const hoverAudio  = new Audio(hoverSoundSrc);
    const selectAudio = new Audio(selectSoundSrc);
    hoverAudio.volume  = 0.5;
    selectAudio.volume = 0.7;
    hoverAudio.preload  = 'auto';
    selectAudio.preload = 'auto';

    /**
     * Play a sound by cloning the Audio node so it can fire
     * even if the previous instance hasn't finished yet.
     */
    function playHover() {
        const sfx = hoverAudio.cloneNode();
        sfx.volume = 0.45;
        sfx.play().catch(() => {}); // Ignore autoplay policy errors silently
    }

    function playSelect() {
        const sfx = selectAudio.cloneNode();
        sfx.volume = 0.7;
        sfx.play().catch(() => {});
    }

    /**
     * Attach hover + click sounds to any set of elements.
     * @param {NodeList|Array} elements
     * @param {boolean} includeClick – also bind the click/select sound
     */
    function bindSounds(elements, includeClick = true) {
        elements.forEach(el => {
            el.addEventListener('mouseenter', playHover);
            if (includeClick) {
                el.addEventListener('mousedown', playSelect);
            }
        });
    }

    // ── Attach to ALL interactive elements on initial load ──
    function attachSoundsToAll() {
        // Nav menu items (desktop + mobile)
        bindSounds(document.querySelectorAll('.p5-menu-item, .p5-menu-item-mobile'));

        // All buttons (hx-get, regular)
        bindSounds(document.querySelectorAll('button, [hx-get]'));

        // All links
        bindSounds(document.querySelectorAll('a'));

        // NES badges on hero
        bindSounds(document.querySelectorAll('.nes-badge'));

        // NES containers (cards)
        bindSounds(document.querySelectorAll('.nes-container'), false); // hover only

        // Hamburger button
        bindSounds(document.querySelectorAll('#mobile-menu-btn'));
    }

    attachSoundsToAll();

    // ── Re-attach after every HTMX section swap ──
    document.body.addEventListener('htmx:afterSwap', () => {
        // Re-bind every interactive element inside the swapped content
        const target = document.getElementById('main-display');
        if (!target) return;

        bindSounds(target.querySelectorAll('a, button, [hx-get]'));
        bindSounds(target.querySelectorAll('.project-card, .edu-item, .p5-skill-box'), false);
        bindSounds(target.querySelectorAll('.nes-container'), false);
        bindSounds(target.querySelectorAll('.nes-btn'));
    });

    // ============================================
    // MOBILE MENU LOGIC
    // ============================================
    const mobileMenuBtn    = document.getElementById('mobile-menu-btn');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    mobileMenuBtn?.addEventListener('click', () => {
        const isOpen = mobileNavOverlay.classList.contains('is-open');
        if (isOpen) {
            closeMobileMenu();
        } else {
            mobileNavOverlay.classList.remove('hidden');
            mobileNavOverlay.classList.add('is-open');
            mobileMenuBtn.classList.add('menu-open');

            anime({
                targets: '.p5-menu-item-mobile',
                translateX: [-80, 0],
                opacity: [0, 1],
                duration: 400,
                delay: anime.stagger(60),
                easing: 'easeOutExpo'
            });
        }
    });

    mobileNavOverlay?.addEventListener('click', (e) => {
        if (e.target === mobileNavOverlay) {
            closeMobileMenu();
        }
    });

    // ============================================
    // 1. HERO ANIMATION (Entrance)
    // ============================================
    const heroTl = gsap.timeline();
    heroTl.from(".p5-title span", {
        x: -200,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out"
    })
    .from(".p5-desc", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
    }, "-=0.5")
    .from(".nes-badge", {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(3)"
    }, "-=0.3");

    // ============================================
    // 2. DESKTOP MENU ANIMATIONS (Anime.js)
    // ============================================
    const menuItems = document.querySelectorAll('.p5-menu-item');
    menuItems.forEach((item) => {
        item.addEventListener('mouseenter', () => {
            anime({
                targets: item,
                translateX: -15,
                scale: 1.1,
                rotate: '-2deg',
                duration: 400,
                easing: 'easeOutElastic(1, .8)'
            });
        });
        
        item.addEventListener('mouseleave', () => {
            anime({
                targets: item,
                translateX: 0,
                scale: 1,
                rotate: '0deg',
                duration: 400,
                easing: 'easeOutElastic(1, .8)'
            });
        });
    });

    // ============================================
    // 3. SCROLL REVEAL
    // ============================================
    const sections = ['#about', '#education', '#skills', '#projects', '#experience'];
    
    sections.forEach(section => {
        gsap.from(`${section} h2, ${section} .nes-container`, {
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            x: section === '#skills' ? 100 : -100,
            opacity: 0,
            duration: 1,
            skewX: section === '#skills' ? 10 : -10,
            ease: "power3.out"
        });
    });

    // ============================================
    // 4. HEART PULSE
    // ============================================
    anime({
        targets: '.p5-heart',
        scale: [1, 1.2],
        opacity: [0.5, 1],
        duration: 1000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutQuad'
    });

    // ============================================
    // 5. HTMX DYNAMIC CONTENT TRANSITION
    // ============================================
    document.body.addEventListener('htmx:afterSwap', (event) => {
        const target = event.detail.target;
        
        // Persona "Shatter" Entrance
        const entranceElement = target.firstElementChild;
        if (entranceElement) {
            gsap.killTweensOf(entranceElement);
            gsap.fromTo(entranceElement, 
                { x: 200, skewX: -20, opacity: 0 },
                {
                    duration: 0.8,
                    x: 0,
                    skewX: 0,
                    opacity: 1,
                    ease: "power4.out",
                    clearProps: "all"
                }
            );
        }

        // Re-animate internal elements
        const itemsToAnimate = target.querySelectorAll('.nes-container, .edu-item, .project-card, .p5-skill-box');
        if (itemsToAnimate.length > 0) {
            gsap.killTweensOf(itemsToAnimate);
            gsap.fromTo(itemsToAnimate, 
                { opacity: 0, y: 30 },
                {
                    duration: 0.6,
                    opacity: 1,
                    y: 0,
                    stagger: 0.05,
                    ease: "back.out(1.2)",
                    delay: 0.1,
                    clearProps: "all"
                }
            );
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ============================================
    // 6. RESIZE HANDLER
    // ============================================
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }
    });
});

// Global close menu (called from onclick in HTML)
function closeMobileMenu() {
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileMenuBtn    = document.getElementById('mobile-menu-btn');
    if (mobileNavOverlay) {
        mobileNavOverlay.classList.add('hidden');
        mobileNavOverlay.classList.remove('is-open');
    }
    if (mobileMenuBtn) {
        mobileMenuBtn.classList.remove('menu-open');
    }
}
