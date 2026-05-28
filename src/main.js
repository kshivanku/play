import "./styles.css";

const hero = document.querySelector("[data-scroll-hero]");
const title = document.querySelector("[data-play-title]");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateHero() {
  if (!hero || !title) return;

  const scrollable = Math.max(1, window.innerHeight * 0.92);
  const progress = clamp(window.scrollY / scrollable, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);

  const startSize = Math.min(window.innerWidth * 0.38, window.innerHeight * 1.08);
  const endSize = clamp(window.innerWidth * 0.14, 92, 190);
  const fontSize = startSize + (endSize - startSize) * eased;
  const gap = window.innerWidth * 0.115 * eased;
  const y = -window.innerHeight * 0.18 * eased;

  title.style.setProperty("--play-font-size", `${fontSize}px`);
  title.style.setProperty("--play-gap", `${gap}px`);
  title.style.setProperty("--play-y", `${y}px`);
  title.style.setProperty("--play-progress", progress.toFixed(3));
}

updateHero();
window.addEventListener("scroll", updateHero, { passive: true });
window.addEventListener("resize", updateHero);
