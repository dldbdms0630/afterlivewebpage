// ── SCROLL REVEAL ─────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

// ── PARTICLE CANVAS ────────────────────────────────────────
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const PALETTES = [
  [63, 255, 210],
  [63, 255, 210],
  [63, 255, 210],
  [26, 107, 138],
  [26, 107, 138],
  [100, 200, 220],
  [100, 200, 220],
  [232, 149, 109],
  [212, 96, 122],
];

class Particle {
  constructor() { this.reset(true); }
  reset(initial) {
    this.x  = Math.random() * W;
    this.y  = initial ? Math.random() * H : H + 10;
    this.r  = Math.random() * 1.4 + 0.2;
    this.vx = (Math.random() - 0.5) * 0.1;
    this.vy = -(Math.random() * 0.3 + 0.04);
    this.life = 0;
    this.maxLife = Math.random() * 500 + 200;
    this.baseAlpha = Math.random() * 0.4 + 0.05;
    this.color = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    if (this.life > this.maxLife || this.y < -10) this.reset(false);
  }
  draw() {
    const t = this.life / this.maxLife;
    const alpha = this.baseAlpha * Math.sin(t * Math.PI);
    const [r,g,b] = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fill();
  }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());

function animate() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animate);
}
animate();

// ── COUNTER ANIMATION ─────────────────────────────────────
function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n.toLocaleString();
}

const counters = document.querySelectorAll('.stat-num[data-target]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNum(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatNum(target);
    }
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(el => counterObserver.observe(el));