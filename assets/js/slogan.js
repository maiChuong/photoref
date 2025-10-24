// slogan.js
export function initSlogan() {
  const slogans = [
    "Stay inspired. Create boldly.",
    "Every pixel tells a story.",
    "Your vision deserves the spotlight.",
    "Design with purpose, draw with passion.",
    "Creativity begins with courage.",
    "Make something that moves people.",
    "Art is your voice — speak loudly.",
    "Push boundaries. Embrace color.",
    "Sketch the future you imagine.",
    "Let your layers reflect your brilliance."
  ];

  const sloganEl = document.getElementById('motivational-slogan');
  if (!sloganEl) return;

  const now = new Date();
  const index = Math.floor(now.getTime() / (1000 * 60 * 60 * 12)) % slogans.length;
  sloganEl.textContent = slogans[index];
}
