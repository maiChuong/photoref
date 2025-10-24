import { initSidebar } from './sidebar.js';
import { initCanvas } from './canvas.js';
import { initControls } from './controls.js';
import { initDrawLayer } from './draw.js';
import { initScreenshotTool } from './screenshot.js';

function initApp() {
  try {
    initSidebar();
    initCanvas();
    initControls();
    initDrawLayer();
  } catch (e) {
    console.error('[Init] Core modules failed:', e);
  }

  // Delay screenshot tool until layout is painted
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
