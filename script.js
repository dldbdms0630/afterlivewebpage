// ── CONFIG ─────────────────────────────────────────────────
// Set this to your ngrok URL when running the Flask server
// e.g. "https://abc123.ngrok-free.app"
// Leave as localhost for local testing
// const SERVER_URL = "http://localhost:5000";
const SERVER_URL = "https://gnat-uplifted-carport.ngrok-free.dev";

// ── SCROLL REVEAL ──────────────────────────────────────────
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
let W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const PALETTES = [
  [201,169,110],[201,169,110],[201,169,110],[201,169,110],
  [180,145,85],[180,145,85],
  [220,195,145],[220,195,145],
  [210,130,80],
  [190,100,90],
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

const particles = [];
for (let i = 0; i < 120; i++) particles.push(new Particle());

function animate() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animate);
}
animate();

// ── COUNTER ANIMATION ──────────────────────────────────────
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

// ── FORM STEP LOGIC ────────────────────────────────────────
function showStep(id) {
  document.querySelectorAll('.form-step').forEach(s => {
    s.classList.remove('active');
  });
  const el = document.getElementById(id);
  // retrigger animation
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = '';
  el.classList.add('active');
}

// consent → step 1
document.getElementById('btn-consent').addEventListener('click', () => {
  showStep('step-1');
});

// retry → step 1
document.getElementById('btn-retry').addEventListener('click', () => {
  showStep('step-1');
});

// steps 1–3: file select → enable next, next → advance
[1, 2, 3, 4].forEach(n => {
  const input   = document.getElementById(`file-${n}`);
  const preview = document.getElementById(`preview-${n}`);
  const btn     = document.getElementById(`btn-${n}`);
  const zone    = document.getElementById(`zone-${n}`);

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      preview.style.backgroundImage = `url(${e.target.result})`;
      preview.classList.add('loaded');
      zone.querySelector('.upload-icon').style.opacity = '0';
      zone.querySelector('.upload-text').style.opacity = '0';
    };
    reader.readAsDataURL(file);
    btn.disabled = false;
  });

  if (n < 4) {
    btn.addEventListener('click', () => showStep(`step-${n + 1}`));
  }
});

// ── SUBMIT ─────────────────────────────────────────────────
document.getElementById('btn-4').addEventListener('click', async () => {
  const files = [1,2,3,4].map(n => document.getElementById(`file-${n}`).files[0]);

  if (files.some(f => !f)) {
    document.getElementById('error-msg').textContent =
      'Please select all four photos before submitting.';
    showStep('step-error');
    return;
  }

  showStep('step-uploading');

  const formData = new FormData();
  files.forEach((file, i) => formData.append(`photo_${i + 1}`, file));
  formData.append('session_id', Date.now().toString());

  try {
    const res = await fetch(`${SERVER_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
        'ngrok-skip-browser-warning': 'true'
    }
    });

    if (res.ok) {
      showStep('step-done');
    } else {
      const text = await res.text();
      document.getElementById('error-msg').textContent =
        `Server error ${res.status}. ${text}`;
      showStep('step-error');
    }
  } catch (err) {
    document.getElementById('error-msg').textContent =
      'Could not reach the server. Make sure it is running and the URL is correct.';
    showStep('step-error');
  }
});