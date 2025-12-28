/**
 * Research Journey - Interactive Scroll Animation
 * Uses Intersection Observer API for buttery smooth scroll effects
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        rootMargin: '-40% 0px -40% 0px', // Trigger when element is in center 20% of viewport
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    };

    // Character speech messages
    const SPEECH_MESSAGES = {
        degree: ["📚 New chapter!", "🎓 Growing!", "🌟 Learning!"],
        paper: ["📝 Published!", "🌸 Research blooms!", "✨ Discovery!"],
        project: ["🔨 Building!", "💡 Creating!", "🌱 Growing!"],
        future: ["🚀 Onwards!", "🗺️ More ahead!", "🌈 Future awaits!"]
    };

    /**
     * Initialize the Research Journey - Simplified
     */
    function init() {
        const milestones = document.querySelectorAll('.milestone');
        
        if (!milestones.length) {
            console.warn('No milestones found');
            return;
        }

        // Add accessibility attributes
        milestones.forEach(milestone => {
            milestone.setAttribute('tabindex', '0');
            milestone.setAttribute('role', 'article');
            milestone.setAttribute('aria-label', 
                milestone.querySelector('.milestone-title')?.textContent || 'Milestone');
        });

        // Add smooth scrolling for anchor links
        enableSmoothScrolling();

        console.log(`Research Journey initialized with ${milestones.length} milestones`);
    }

    /**
     * Create and configure Intersection Observer
     */
    function createObserver() {
        const observerOptions = {
            root: null, // Use viewport as root
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                const milestone = entry.target;
                const intersectionRatio = entry.intersectionRatio;
                
                // Activate milestone when it's significantly visible in the center area
                if (entry.isIntersecting && intersectionRatio > 0.3) {
                    activateMilestone(milestone);
                } else if (!entry.isIntersecting || intersectionRatio < 0.2) {
                    deactivateMilestone(milestone);
                }
            });
        };

        return new IntersectionObserver(observerCallback, observerOptions);
    }

    /**
     * Activate a milestone (apply hero effect)
     */
    function activateMilestone(milestone) {
        // Deactivate all other milestones first
        const allMilestones = document.querySelectorAll('.milestone');
        allMilestones.forEach(m => {
            if (m !== milestone) {
                m.classList.remove('active');
                m.setAttribute('aria-current', 'false');
            }
        });

        // Activate this milestone
        milestone.classList.add('active');
        milestone.setAttribute('aria-current', 'true');

        // Animate the timeline marker
        const marker = milestone.querySelector('.milestone-marker');
        if (marker) {
            marker.style.animation = 'none';
            // Trigger reflow
            void marker.offsetWidth;
            marker.style.animation = 'markerPulse 0.6s ease';
        }

        // Update character state and speech
        updateCharacterState(milestone);

        // Optional: Log for debugging
        const title = milestone.querySelector('.milestone-title')?.textContent;
        console.log(`Activated milestone: ${title}`);
    }

    /**
     * Deactivate a milestone
     */
    function deactivateMilestone(milestone) {
        milestone.classList.remove('active');
        milestone.setAttribute('aria-current', 'false');
    }

    /**
     * Initialize character
     */
    function initializeCharacter() {
        const character = document.querySelector('.journey-character');
        if (!character) return;

        // Show initial speech bubble
        setTimeout(() => {
            showSpeechBubble("Let's walk! 🌸");
        }, 500);

        // Hide speech bubble after a while
        setTimeout(() => {
            hideSpeechBubble();
        }, 2500);
    }

    /**
     * Update character position based on scroll
     */
    function updateCharacterPosition() {
        const character = document.querySelector('.journey-character');
        const timeline = document.querySelector('.timeline');
        if (!character || !timeline) return;

        // Add walking animation when scrolling
        character.classList.add('walking');
        
        // Clear previous timeout
        if (window.walkingTimeout) {
            clearTimeout(window.walkingTimeout);
        }
        
        // Stop walking after scroll ends
        window.walkingTimeout = setTimeout(() => {
            character.classList.remove('walking');
        }, 200);
    }

    /**
     * Update character state based on milestone
     */
    function updateCharacterState(milestone) {
        const character = document.querySelector('.journey-character');
        if (!character) return;

        const milestoneType = milestone.getAttribute('data-type') || 'project';
        
        // Add celebration animation
        character.classList.add('celebrating');
        setTimeout(() => {
            character.classList.remove('celebrating');
        }, 1200);

        // Show appropriate speech bubble
        const messages = SPEECH_MESSAGES[milestoneType] || SPEECH_MESSAGES.project;
        const message = messages[Math.floor(Math.random() * messages.length)];
        showSpeechBubble(message);

        // Hide speech bubble after delay
        setTimeout(() => {
            hideSpeechBubble();
        }, 2500);

        // Add particles effect
        createParticles(milestone);
    }

    /**
     * Show speech bubble
     */
    function showSpeechBubble(text) {
        const bubble = document.querySelector('.character-speech-bubble');
        const speechText = document.querySelector('.speech-text');
        if (!bubble || !speechText) return;

        speechText.textContent = text;
        bubble.classList.add('show');
    }

    /**
     * Hide speech bubble
     */
    function hideSpeechBubble() {
        const bubble = document.querySelector('.character-speech-bubble');
        if (!bubble) return;
        bubble.classList.remove('show');
    }

    /**
     * Create particle effects - Nature themed
     */
    function createParticles(milestone) {
        const rect = milestone.getBoundingClientRect();
        const particleCount = 6;
        const particles = ['🌸', '🌼', '🍃', '✨', '🌺', '🦋'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            
            const randomX = Math.random() * 100 - 50;
            const randomY = Math.random() * 60 - 30;
            
            particle.style.cssText = `
                position: fixed;
                left: 15%;
                top: 35%;
                font-size: 1.2rem;
                pointer-events: none;
                z-index: 9999;
                opacity: 0;
            `;
            
            document.body.appendChild(particle);
            
            // Animate
            setTimeout(() => {
                particle.style.transition = 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                particle.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${Math.random() * 360}deg) scale(1.5)`;
                particle.style.opacity = '1';
            }, i * 50);
            
            setTimeout(() => {
                particle.style.opacity = '0';
            }, 800 + i * 50);
            
            setTimeout(() => particle.remove(), 1500);
        }
    }

    /**
     * Add scroll indicator at the top
     */
    function addScrollIndicator() {
        const header = document.querySelector('.journey-header');
        if (!header) return;

        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = `
            <div class="scroll-arrow">→</div>
            <p class="scroll-text">Scroll horizontally</p>
        `;
        indicator.style.cssText = `
            text-align: center;
            margin-top: 1.5rem;
            animation: floatHorizontal 2s ease-in-out infinite;
        `;

        const arrow = indicator.querySelector('.scroll-arrow');
        arrow.style.cssText = `
            font-size: 1.5rem;
            color: var(--color-accent);
            margin-bottom: 0.5rem;
        `;

        const text = indicator.querySelector('.scroll-text');
        text.style.cssText = `
            font-size: 0.75rem;
            color: var(--color-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
        `;

        header.appendChild(indicator);

        // Add floating animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatHorizontal {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(10px); }
            }
            @keyframes markerPulse {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.3); }
                100% { transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        // Hide indicator after user starts scrolling
        let hasScrolled = false;
        const journeyContainer = document.querySelector('.journey-container');
        if (journeyContainer) {
            journeyContainer.addEventListener('scroll', () => {
                if (!hasScrolled && journeyContainer.scrollLeft > 50) {
                    hasScrolled = true;
                    indicator.style.opacity = '0';
                    indicator.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => indicator.remove(), 500);
                }
            }, { passive: true });
        }
    }

    /**
     * Enable smooth scrolling for internal links
     */
    function enableSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            });
        });
    }

    /**
     * Add keyboard navigation for horizontal scroll
     */
    function addKeyboardNavigation() {
        const journeyContainer = document.querySelector('.journey-container');
        if (!journeyContainer) return;

        document.addEventListener('keydown', (e) => {
            const milestones = Array.from(document.querySelectorAll('.milestone'));
            const activeMilestone = document.querySelector('.milestone.active');
            
            if (!activeMilestone && milestones.length > 0) return;
            
            const currentIndex = activeMilestone ? milestones.indexOf(activeMilestone) : -1;
            let targetIndex = -1;

            // Arrow right or 'd' - next milestone
            if (e.key === 'ArrowRight' || e.key === 'd') {
                e.preventDefault();
                targetIndex = Math.min(currentIndex + 1, milestones.length - 1);
            }
            
            // Arrow left or 'a' - previous milestone
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                e.preventDefault();
                targetIndex = Math.max(currentIndex - 1, 0);
            }

            if (targetIndex !== -1 && targetIndex !== currentIndex) {
                milestones[targetIndex].scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }
        });
    }

    /**
     * Performance optimization: Throttle scroll events
     */
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Add progress indicator for horizontal scroll
     */
    function addProgressIndicator() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--color-accent), var(--color-accent-2), var(--color-accent-3));
            width: 0%;
            z-index: 9999;
            transition: width 0.2s ease;
        `;
        document.body.appendChild(progressBar);

        const journeyContainer = document.querySelector('.journey-container');
        if (!journeyContainer) return;

        const updateProgress = throttle(() => {
            const scrollWidth = journeyContainer.scrollWidth - journeyContainer.clientWidth;
            const scrolled = journeyContainer.scrollLeft;
            const progress = (scrolled / scrollWidth) * 100;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }, 50);

        journeyContainer.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    /**
     * Initialize on DOM ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
        });
    } else {
        init();
    }

    // Expose API for potential extensions
    window.ResearchJourney = {
        version: '1.0.0',
        activateMilestone,
        deactivateMilestone
    };

})();

