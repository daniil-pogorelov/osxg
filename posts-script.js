/* ===== posts-script.js — OSXG+ Forum Posts Page ===== */

// ─── Config (mirrors script.js) ───────────────────────────────
const DISCORD_INVITE_CODE = "CSMCXcVEPk";
const WORKER_URL = "https://osxg.1221647.workers.dev";
const GUILD_ID   = "1474754589491335412";

// ─── Navbar scroll effect ────────────────────────────────────
const navbar = document.getElementById("navbar");
const onScroll = () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ─── Hamburger menu (mobile) ─────────────────────────────────
const hamburger = document.getElementById("hamburger");
const navLinks  = document.querySelector(".nav-links");
if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("mobile-open");
  });
}

// ─── Mobile nav close on link click ──────────────────────────
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks && navLinks.classList.remove("mobile-open");
  });
});

// ─── CTA button pulse ────────────────────────────────────────
document.querySelectorAll(".btn-primary").forEach((btn) => {
  btn.addEventListener("mouseenter", () => { btn.style.transform = "translateY(-3px) scale(1.02)"; });
  btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
});

// ─── Intersection Observer — fade-in ─────────────────────────
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));

// ─── Particle canvas background ──────────────────────────────
(function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles;

  const PARTICLE_COUNT = 90;
  const COLORS = ["#9333ea", "#7c3aed", "#a855f7", "#c084fc", "#8b5cf6"];

  function resize() {
    W = canvas.width  = window.innerWidth;
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
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139,92,246,${(1 - dist / 120) * 0.12})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      p.x += p.dx; p.y += p.dy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });
    requestAnimationFrame(draw);
  }
  resize(); createParticles(); draw();
  window.addEventListener("resize", () => { resize(); createParticles(); });
})();

// ─── Helpers ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch (_) { return ""; }
}

function timeSince(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const days  = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ─── Render a single post card ────────────────────────────────
function renderPostCard(post) {
  const tagsHtml = (post.tags ?? [])
    .map((t) => `<span class="post-tag">${escHtml(t)}</span>`)
    .join("");

  // When SHOW_POST_CONTENT=true the worker sends post.content; show a faded excerpt.
  // When false (default) *or* when the post has no text (embed/image only),
  // show a "locked" placeholder so visitors know more exists.
  const hasContent = typeof post.content === "string" && post.content.trim().length > 0;
  const excerptHtml = hasContent
    ? `<div class="post-excerpt-wrap">
        <p class="post-excerpt">${escHtml(post.content)}</p>
       </div>`
    : `<div class="post-locked">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Full guide available inside the Discord server
       </div>`;

  const dateStr = formatDate(post.createdAt);
  const relDate = timeSince(post.createdAt);
  const replies = post.replyCount ?? 0;

  return `
    <article class="post-card fade-in" role="listitem" itemscope itemtype="https://schema.org/Article">
      ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ""}
      <h2 itemprop="headline">${escHtml(post.title)}</h2>
      ${excerptHtml}
      <div class="post-meta">
        <span title="${dateStr}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <time datetime="${post.createdAt ?? ""}" itemprop="datePublished">${relDate}</time>
        </span>
        <span title="${replies} replies">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          ${replies} repl${replies === 1 ? "y" : "ies"}
        </span>
        ${post.isArchived ? `<span title="Archived">📁 Archived</span>` : `<span title="Active">🟢 Active</span>`}
      </div>
      <a
        class="post-cta"
        href="${escHtml(post.discordUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Read full post: ${escHtml(post.title)}"
        itemprop="url"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.131 18.115a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
        </svg>
        Join Discord to Read →
      </a>
    </article>
  `;
}

// ─── Inject ItemList JSON-LD dynamically ──────────────────────
function injectItemListSchema(posts) {
  const items = posts.map((post, idx) => ({
    "@type": "ListItem",
    "position": idx + 1,
    "name": post.title,
    "url": post.discordUrl,
  }));

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "OSXG+ Mac Gaming Discord Forum Posts",
    "description": "Community tutorials and guides on GTA V on Mac, CrossOver, Whisky, and Apple Silicon gaming.",
    "url": "https://osxg.tech/posts.html",
    "numberOfItems": posts.length,
    "itemListElement": items,
  });
  document.head.appendChild(script);
}

// ─── Main: load posts ─────────────────────────────────────────
(async function loadPosts() {
  const grid     = document.getElementById("posts-grid");
  const skeleton = document.getElementById("posts-skeleton");
  const countEl  = document.getElementById("posts-count");

  if (!grid) return;

  try {
    const res = await fetch(`${WORKER_URL}/posts`);
    if (!res.ok) throw new Error(`Worker responded with ${res.status}`);
    const data = await res.json();
    const posts = data.posts ?? [];

    // Hide skeleton, show grid
    skeleton.style.display = "none";
    grid.style.display = "grid";

    if (posts.length === 0) {
      grid.innerHTML = `
        <div class="posts-empty">
          <span class="empty-icon">📭</span>
          <p>No forum posts found yet. <a href="https://discord.gg/CSMCXcVEPk" target="_blank" rel="noopener noreferrer" style="color:#a855f7">Join the Discord</a> to be the first!</p>
        </div>`;
      return;
    }

    // Update count label
    countEl.innerHTML = `Showing <strong>${posts.length}</strong> posts`;

    // Render cards
    grid.innerHTML = posts.map(renderPostCard).join("");

    // Observe newly rendered cards for fade-in
    grid.querySelectorAll(".fade-in").forEach((el) => io.observe(el));

    // Inject schema
    injectItemListSchema(posts);

  } catch (err) {
    console.warn("[OSXG+] Could not load posts:", err);
    skeleton.style.display = "none";
    grid.style.display = "grid";
    grid.innerHTML = `
      <div class="posts-empty">
        <span class="empty-icon">⚠️</span>
        <p>Couldn't load posts right now. <a href="https://discord.gg/CSMCXcVEPk" target="_blank" rel="noopener noreferrer" style="color:#a855f7">Visit the Discord directly →</a></p>
      </div>`;
  }
})();
