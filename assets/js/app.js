import { initSidebar } from './sidebar.js';
import { initCanvas } from './canvas.js';
import { initControls } from './controls.js';
import { initDrawLayer } from './draw.js';
import { initScreenshotTool } from './screenshot.js';
import { initSlogan } from './slogan.js';
import { initFlash } from './welcomecard.js'; // ✅ Add flash popup initializer

function initApp() {
  try {
    initSidebar();
    initCanvas();
    initControls();
    initDrawLayer();
    initSlogan();     // ✅ Load motivational slogan
    initFlash();      // ✅ Trigger welcome popup if first access
  } catch (e) {
    console.error('[Init] Core modules failed:', e);
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      const box = document.getElementById('screenshot-box');
      if (box) {
        try {
          initScreenshotTool();
        } catch (e) {
          console.error('[Init] Screenshot tool failed:', e);
        }
      } else {
        console.warn('[Init] screenshot-box not found in DOM.');
      }
    }, 50);
  });
}

document.addEventListener('DOMContentLoaded', initApp);
