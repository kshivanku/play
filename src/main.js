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

  const scrollable = Math.max(1, window.innerHeight * 0.92);
  const progress = clamp(window.scrollY / scrollable, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);

  const startSize = Math.min(window.innerWidth * 0.46, window.innerHeight * 1.36);
  const endSize = clamp(window.innerWidth * 0.16, 104, 220);
  const fontSize = startSize + (endSize - startSize) * eased;
  const titleWidth = 72 + 28 * eased;
  const y = -window.innerHeight * 0.16 * eased;
  const widthAxis = 48 + 18 * eased;
  const upperAxis = 760 - 70 * eased;
  const ascenderAxis = 854 - 56 * eased;

  title.style.setProperty("--play-font-size", `${fontSize}px`);
  title.style.setProperty("--play-width", `${titleWidth}vw`);
  title.style.setProperty("--play-y", `${y}px`);
  title.style.setProperty("--play-wdth", widthAxis.toFixed(1));
  title.style.setProperty("--play-ytuc", upperAxis.toFixed(1));
  title.style.setProperty("--play-ytas", ascenderAxis.toFixed(1));
  title.style.setProperty("--play-progress", progress.toFixed(3));
}

updateHero();
document.querySelectorAll("[data-game-video]").forEach((video) => {
  const key = video.dataset.gameVideo;
  if (videos[key]) video.src = videos[key];
});

window.addEventListener("scroll", updateHero, { passive: true });
window.addEventListener("resize", updateHero);
