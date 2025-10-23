import { initSidebar } from './sidebar.js';
import { initCanvas } from './canvas.js';
import { initControls } from './controls.js';
import { initDrawLayer } from './draw.js';

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initCanvas();
  initControls();
  initDrawLayer();
});