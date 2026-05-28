import "./styles.css";
import beGratefulVideo from "../assets/begrateful.mov?url";
import youAreMyTimerVideo from "../assets/youaremytimer.mov?url";

const hero = document.querySelector("[data-scroll-hero]");
const title = document.querySelector("[data-play-title]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const videos = {
  "be-grateful": beGratefulVideo,
  "you-are-my-timer": youAreMyTimerVideo,
};

let introProgress = reduceMotion ? 1 : 0;
let introStart = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateHero() {
  if (!hero || !title) return;

  const heroHeight = hero.getBoundingClientRect().height || window.innerHeight;
  const scrollable = Math.max(1, heroHeight);
  const progress = clamp(window.scrollY / scrollable, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);

  const startSize = Math.min(window.innerWidth * 0.32, heroHeight * 1.16);
  const endSize = clamp(window.innerWidth * 0.07, 64, 96);
  let fontSize = startSize + (endSize - startSize) * eased;
  const barHeight = heroHeight + (100 - heroHeight) * eased;
  const titleWidth = 94 + 4 * eased;
  const settle = 1 - Math.pow(1 - introProgress, 3);
  const widthAxis = 151 + (25 + 35 * eased - 151) * settle;
  const weightAxis = 360 + (1000 - 360) * settle;
  const upperAxis = 528 + (760 - 70 * eased - 528) * settle;
  const ascenderAxis = 649 + (854 - 56 * eased - 649) * settle;
  const introScale = 0.985 + 0.015 * settle;
  const introY = (1 - settle) * 24;

  hero.style.setProperty("--play-font-size", `${fontSize}px`);
  hero.style.setProperty("--play-bar-height", `${barHeight}px`);
  hero.style.setProperty("--play-width", `${titleWidth}vw`);
  hero.style.setProperty("--play-y", `${introY}px`);
  hero.style.setProperty("--play-wdth", widthAxis.toFixed(1));
  hero.style.setProperty("--play-wght", weightAxis.toFixed(1));
  hero.style.setProperty("--play-ytuc", upperAxis.toFixed(1));
  hero.style.setProperty("--play-ytas", ascenderAxis.toFixed(1));
  hero.style.setProperty("--play-scale", introScale.toFixed(3));
  hero.style.setProperty("--play-opacity", settle.toFixed(3));
  hero.style.setProperty("--play-progress", progress.toFixed(3));

  const maxWidth = window.innerWidth * 0.98;
  if (title.scrollWidth > maxWidth) {
    fontSize *= maxWidth / title.scrollWidth;
    hero.style.setProperty("--play-font-size", `${fontSize}px`);
  }
}

function animateIntro(timestamp) {
  if (reduceMotion) return;
  introStart ??= timestamp;
  introProgress = clamp((timestamp - introStart) / 950, 0, 1);
  updateHero();
  if (introProgress < 1) requestAnimationFrame(animateIntro);
}

updateHero();
if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    updateHero();
    requestAnimationFrame(animateIntro);
  });
} else {
  updateHero();
  requestAnimationFrame(animateIntro);
}
document.querySelectorAll("[data-game-video]").forEach((video) => {
  const key = video.dataset.gameVideo;
  if (videos[key]) video.src = videos[key];
});

window.addEventListener("scroll", updateHero, { passive: true });
window.addEventListener("resize", updateHero);
