/* ===== script.js — OSXG+ Landing Page ===== */

// ─── Config ──────────────────────────────────
const DISCORD_INVITE_CODE = "CSMCXcVEPk";

/**
 * WORKER_URL: URL of your deployed Cloudflare Worker (worker.js).
 * Once you deploy it, replace the placeholder below with your actual worker URL.
 * Example: "https://osxg-stats.yourname.workers.dev"
 *
 * Until deployed, the page will only show member + online counts from the
 * public invite API. Tutorial count will appear as "—".
 */
const WORKER_URL = "https://osxg.1221647.workers.dev"; // ← paste your deployed worker URL here

// ─── Navbar scroll effect ───────────────────
const navbar = document.getElementById("navbar");
const onScroll = () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ─── Hamburger menu (mobile) ─────────────────
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");
if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("mobile-open");
  });
}

// ─── Live Discord Stats ───────────────────────
(async function loadDiscordStats() {
  const elMembers  = document.getElementById("stat-members");
  const elTutorials = document.getElementById("stat-tutorials");
  const elOnline   = document.getElementById("stat-online");

  // Helper: animated count-up
  function countUp(el, target, prefix = "", suffix = "") {
    if (!el || isNaN(target)) return;
    const duration = 1600;
    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = prefix + Math.round(ease * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // ── Step 1: Invite API — always public, no auth needed ──────────────────
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`
    );
    if (res.ok) {
      const data = await res.json();
      const members = data.approximate_member_count ?? data?.profile?.member_count;
      const online  = data.approximate_presence_count ?? data?.profile?.online_count;
      if (members) countUp(elMembers, members);
      if (online)  countUp(elOnline, online);
    }
  } catch (e) {
    console.warn("[OSXG+] Could not fetch invite stats:", e);
  }

  // ── Step 2: Cloudflare Worker — for tutorial forum thread count ──────────
  if (WORKER_URL) {
    try {
      const res = await fetch(`${WORKER_URL}/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.tutorialCount != null) countUp(elTutorials, data.tutorialCount);
        // Worker data is more accurate so override invite API values if present
        if (data.members) countUp(elMembers, data.members);
        if (data.online)  countUp(elOnline, data.online);
      }
    } catch (e) {
      console.warn("[OSXG+] Could not fetch worker stats:", e);
    }
  }
})();


// ─── Particle canvas background ─────────────
(function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles;

  const PARTICLE_COUNT = 90;
  const COLORS = ["#9333ea", "#7c3aed", "#a855f7", "#c084fc", "#8b5cf6"];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connection lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - dist / 120) * 0.12})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });
})();

// ─── Counter animation for hero stats ────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(ease * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ─── Intersection Observer — fade-in & counters ─
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        // Trigger counters inside if any
        entry.target.querySelectorAll("[data-target]").forEach(animateCounter);
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 },
);

// Observe fade-in elements
document
  .querySelectorAll(
    ".feature-card, .step, .game-pill, .tutorial-card, .join-inner, .section-header",
  )
  .forEach((el) => {
    el.classList.add("fade-in");
    io.observe(el);
  });

// Observe stat numbers themselves (in the hero)
const statsSection = document.querySelector(".hero-stats");
if (statsSection) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target
            .querySelectorAll("[data-target]")
            .forEach(animateCounter);
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  statsObserver.observe(statsSection);
}

// ─── Feature card entrance delay ─────────────
document.querySelectorAll(".feature-card[data-delay]").forEach((card) => {
  const delay = parseInt(card.dataset.delay, 10);
  card.style.transitionDelay = delay + "ms";
});

// ─── Add staggered delays to steps ───────────
document.querySelectorAll(".step").forEach((step, i) => {
  step.style.transitionDelay = i * 80 + "ms";
});

// ─── Add staggered delays to game pills ───────
document.querySelectorAll(".game-pill").forEach((pill, i) => {
  pill.style.transitionDelay = i * 50 + "ms";
});

// ─── Smooth active step highlight on scroll ──
(() => {
  const steps = document.querySelectorAll(".step");
  if (!steps.length) return;

  const stepObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          steps.forEach((s) => s.classList.remove("active-step"));
          entry.target.classList.add("active-step");
        }
      });
    },
    { threshold: 0.6 },
  );

  steps.forEach((s) => stepObserver.observe(s));
})();

// ─── Mobile nav close on link click ──────────
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks && navLinks.classList.remove("mobile-open");
  });
});

// ─── CTA button pulse on hover ────────────────
document.querySelectorAll(".btn-primary").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "translateY(-3px) scale(1.02)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "";
  });
});
