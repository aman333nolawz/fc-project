// ========================================
// LUXURY ANIMATIONS CONTROLLER
// GSAP + Lenis Integration
// ========================================

// Initialize smooth scrolling with Lenis
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: "vertical",
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
});

// Integrate Lenis with GSAP ScrollTrigger
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// ========================================
// HERO PARALLAX EFFECT
// ========================================
function initHeroParallax() {
  const heroBg = document.querySelector(".hero-bg");
  if (!heroBg) return;

  // Parallax background (moves slower)
  gsap.to(heroBg, {
    yPercent: 30,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

// ========================================
// HERO CONTENT ANIMATIONS
// ========================================
function initHeroAnimations() {
  const title = document.querySelector(".hero-title");
  const subtitle = document.querySelector(".hero-subtitle");

  if (!title) return;

  const heroSplit = new SplitText(title, { type: "chars, words" });

  gsap.from(heroSplit.chars, {
    yPercent: 100,
    duration: 1.8,
    ease: "expo.out",
    stagger: 0.06,
  });

  // Stagger animation for hero elements
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(title, {
    opacity: 1,
    y: 0,
    duration: 1.2,
    delay: 0.3,
  }).to(
    subtitle,
    {
      opacity: 1,
      y: 0,
      duration: 1,
    },
    "-=0.6",
  );
}

// ========================================
// FLEET SECTION ANIMATIONS
// ========================================
function initFleetAnimations() {
  const fleetHeader = document.querySelector(".fleet-header");

  if (fleetHeader) {
    gsap.to(fleetHeader, {
      opacity: 1,
      y: 0,
      duration: 1,
      scrollTrigger: {
        trigger: fleetHeader,
        start: "top 80%",
        end: "bottom 60%",
        toggleActions: "play none none reverse",
      },
    });
  }
}

// ========================================
// CAR CARDS STAGGER ANIMATION
// ========================================
function animateCarCards() {
  const cards = document.querySelectorAll(".car-card");
  if (cards.length === 0) return;

  gsap.to(cards, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: "#fleet",
      start: "top 60%",
      toggleActions: "play none none reverse",
    },
  });
}

// ========================================
// NAVBAR HIDE/SHOW ON SCROLL
// ========================================
function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  let lastScroll = 0;

  ScrollTrigger.create({
    start: "top -80",
    end: 99999,
    onUpdate: (self) => {
      const currentScroll = self.scroll();

      if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down
        gsap.to(navbar, {
          yPercent: -100,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        // Scrolling up
        gsap.to(navbar, {
          yPercent: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      lastScroll = currentScroll;
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  // Initialize animations
  initHeroParallax();
  initHeroAnimations();
  initFleetAnimations();
  initNavbarScroll();

  // Refresh ScrollTrigger after a delay (ensures proper calculation)
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 500);
});

window.animateCarCards = animateCarCards;
