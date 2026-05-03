import { animate, stagger } from "motion";

// --- 1. Dark Mode Toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');
let isDark = localStorage.getItem('civicseva_theme') === 'dark';

function applyTheme() {
  document.body.classList.toggle('dark', isDark);
}
applyTheme();

themeToggleBtn.addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('civicseva_theme', isDark ? 'dark' : 'light');
  applyTheme();
});

// --- 2. Scroll-Hide Header (Pure scroll listener — motion scroll() is for element-scroll, not window) ---
const header = document.getElementById('scroll-header');
let lastScrollY = 0;
let headerHidden = false;

window.addEventListener('scroll', () => {
  const currentY = window.scrollY;

  if (currentY > lastScrollY && currentY > 150 && !headerHidden) {
    // Scrolling DOWN past 150px - Hide
    animate(header, { y: -100, opacity: 0 }, { duration: 0.3, ease: "easeInOut" });
    headerHidden = true;
  } else if (currentY < lastScrollY && headerHidden) {
    // Scrolling UP - Show
    animate(header, { y: 0, opacity: 1 }, { duration: 0.3, ease: "easeInOut" });
    headerHidden = false;
  }
  lastScrollY = currentY;
}, { passive: true });

// --- 3. Sidebar Menu ---
let isOpen = false;
const toggleBtn = document.getElementById('sidebar-toggle');
const bg = document.getElementById('sidebar-bg');
const navList = document.getElementById('nav-list');
const overlay = document.getElementById('sidebar-container');

// Hamburger line elements (we animate via style transforms, not SVG 'd' attr)
const line1 = document.getElementById('line1');
const line2 = document.getElementById('line2');
const line3 = document.getElementById('line3');

// Menu items colors (matching the provided Variant code)
const colors = ["#FF008C", "#D309E1", "#9C1AFF", "#7700FF", "#4400FF"];
const menuItems = [
  { label: "Report Issue", href: "app.html" },
  { label: "My Profile", href: "#" },
  { label: "View Analytics", href: "#" },
  { label: "Admin Panel", href: "admin.html" },
  { label: "Settings", href: "#" },
];

// Generate real DOM list items with content
colors.forEach((color, i) => {
  const li = document.createElement('li');
  li.className = 'nav-item';
  li.innerHTML = `
    <a href="${menuItems[i].href}" style="
      display:flex; align-items:center; gap:16px;
      text-decoration:none; color: var(--dark); width:100%;
    ">
      <div style="
        width:40px; height:40px; border-radius:50%;
        border: 2px solid ${color};
        background: ${color}22;
        flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        font-size:1.1rem;
      ">${["🗺️","👤","📊","🛡️","⚙️"][i]}</div>
      <span style="font-weight:600; font-size:0.95rem;">${menuItems[i].label}</span>
    </a>
  `;
  navList.appendChild(li);
});

const navItems = document.querySelectorAll('.nav-item');

// Set initial hidden state via CSS (style directly instead of relying on CSS class)
navItems.forEach(item => {
  item.style.opacity = '0';
  item.style.transform = 'translateY(40px)';
});

toggleBtn.addEventListener('click', () => {
  isOpen = !isOpen;

  if (isOpen) {
    overlay.style.pointerEvents = 'auto';

    // Background Circular Expand via clipPath
    animate(bg, 
      { clipPath: "circle(1500px at 40px 40px)" }, 
      { type: "spring", stiffness: 20, restDelta: 2, duration: 0.8 }
    );

    // Hamburger → X morphing via rotation/opacity
    animate(line1, { rotate: 45, y: 8 }, { duration: 0.3 });
    animate(line2, { opacity: 0, scaleX: 0 }, { duration: 0.15 });
    animate(line3, { rotate: -45, y: -8 }, { duration: 0.3 });

    // Staggered Nav Items In (spring bounce)
    animate(navItems,
      { opacity: 1, y: 0 },
      { delay: stagger(0.07, { startDelay: 0.2 }), type: "spring", stiffness: 300, damping: 24 }
    );

  } else {
    overlay.style.pointerEvents = 'none';

    // Background Circular Collapse
    animate(bg,
      { clipPath: "circle(30px at 40px 40px)" },
      { delay: 0.2, type: "spring", stiffness: 400, damping: 40 }
    );

    // X → Hamburger
    animate(line1, { rotate: 0, y: 0 }, { duration: 0.3 });
    animate(line2, { opacity: 1, scaleX: 1 }, { duration: 0.15 });
    animate(line3, { rotate: 0, y: 0 }, { duration: 0.3 });

    // Staggered Nav Items Out (reversed order)
    const reversed = Array.from(navItems).reverse();
    animate(reversed,
      { opacity: 0, y: 40 },
      { delay: stagger(0.05), type: "spring", stiffness: 300, damping: 24 }
    );
  }
});
