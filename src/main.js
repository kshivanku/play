import "./styles.css";
import beGratefulVideo from "../assets/begrateful.mov?url";
import youAreMyTimerVideo from "../assets/youaremytimer.mov?url";

const hero = document.querySelector("[data-scroll-hero]");
const title = document.querySelector("[data-play-title]");
const videos = {
  "be-grateful": beGratefulVideo,
  "you-are-my-timer": youAreMyTimerVideo,
};

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
  const widthAxis = 25 + 35 * eased;
  const upperAxis = 760 - 70 * eased;
  const ascenderAxis = 854 - 56 * eased;

  hero.style.setProperty("--play-font-size", `${fontSize}px`);
  hero.style.setProperty("--play-bar-height", `${barHeight}px`);
  hero.style.setProperty("--play-width", `${titleWidth}vw`);
  hero.style.setProperty("--play-y", "0px");
  hero.style.setProperty("--play-wdth", widthAxis.toFixed(1));
  hero.style.setProperty("--play-ytuc", upperAxis.toFixed(1));
  hero.style.setProperty("--play-ytas", ascenderAxis.toFixed(1));
  hero.style.setProperty("--play-progress", progress.toFixed(3));

  const maxWidth = window.innerWidth * 0.98;
  if (title.scrollWidth > maxWidth) {
    fontSize *= maxWidth / title.scrollWidth;
    hero.style.setProperty("--play-font-size", `${fontSize}px`);
  }
}

updateHero();
document.fonts?.ready.then(updateHero);
document.querySelectorAll("[data-game-video]").forEach((video) => {
  const key = video.dataset.gameVideo;
  if (videos[key]) video.src = videos[key];
});

window.addEventListener("scroll", updateHero, { passive: true });
window.addEventListener("resize", updateHero);
