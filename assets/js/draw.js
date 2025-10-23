// draw.js: Multi-layer drawing support with visibility and lock.
// Fix: The active draw layer remains active after drawing, and all visible layers are always rendered.

import { getDrawLayers, getActiveDrawLayerId } from './sidebar.js';

let drawLayerCanvases = {}; // id -> canvas element
let drawLayerObjects = {};  // id -> array of drawing objects for each layer
let currentTool = 'pen';
let drawColor = '#007bff';
let drawWidth = 2;

// Track currently drawing state per layer
let isDrawing = false;
let start = {};

export function initDrawLayer() {
  setupToolPanel();

  window.addEventListener('draw-layer-added', renderDrawCanvases);
  window.addEventListener('draw-layer-deleted', renderDrawCanvases);
  window.addEventListener('draw-layers-cleared', renderDrawCanvases);
  window.addEventListener('draw-layer-activated', e => {
    // Only update activeDrawLayerId, DO NOT re-render canvases here.
    renderDrawCanvases();
  });
  window.addEventListener('draw-layers-reordered', renderDrawCanvases);
  window.addEventListener('draw-layer-visibility', renderDrawCanvases);
  window.addEventListener('draw-layer-lock', renderDrawCanvases);

  window.addEventListener('resize', renderDrawCanvases);

  renderDrawCanvases();
}

function setupToolPanel() {
  document.querySelectorAll('#draw-control-panel [data-tool]').forEach(btn => {
    btn.onclick = () => {
      currentTool = btn.getAttribute('data-tool');
      document.querySelectorAll('#draw-control-panel [data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  document.getElementById('draw-color').oninput = e => drawColor = e.target.value;
  document.getElementById('draw-width').oninput = e => drawWidth = parseInt(e.target.value, 10);

  document.getElementById('draw-clear').onclick = () => {
    const activeDrawLayerId = getActiveDrawLayerId();
    if (!activeDrawLayerId) return;
    drawLayerObjects[activeDrawLayerId] = [];
    renderDrawLayer(activeDrawLayerId);
  };
}

function renderDrawCanvases() {
  const area = document.querySelector('.canvas-area');
  const layers = getDrawLayers();
  const activeDrawLayerId = getActiveDrawLayerId();

  // Remove all draw canvases
  Object.values(drawLayerCanvases).forEach(canvas => {
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  });
  drawLayerCanvases = {};

  // Add canvases in order (lower index = bottom, higher index = top)
  layers.forEach((layer, idx) => {
    let canvas = document.createElement('canvas');
    canvas.className = 'draw-layer-canvas' + (activeDrawLayerId === layer.id ? ' active' : '');
    canvas.dataset.id = layer.id;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.width = area.offsetWidth;
    canvas.height = area.offsetHeight;
    canvas.style.zIndex = (2000 + idx);
    canvas.style.pointerEvents = layer.visible ? 'auto' : 'none';
    canvas.style.display = layer.visible ? 'block' : 'none';
    area.appendChild(canvas);
    drawLayerCanvases[layer.id] = canvas;

    if (!drawLayerObjects[layer.id]) drawLayerObjects[layer.id] = [];

    // Attach events ONLY for currently active, unlocked, and visible layer
    if (activeDrawLayerId === layer.id && layer.visible && !layer.locked) {
      attachDrawEvents(canvas, layer.id);
    }
    renderDrawLayer(layer.id); // Always render visible layer
  });
}

function attachDrawEvents(canvas, layerId) {
  // Remove previous events to avoid stacking multiple
  canvas.onmousedown = null;
  canvas.onmousemove = null;
  canvas.onmouseup = null;
  canvas.onclick = null;

  canvas.onmousedown = (e) => {
    const layers = getDrawLayers();
    const layer = layers.find(l => l.id === layerId);
    // Only allow drawing if layer is active, visible, and unlocked
    if (getActiveDrawLayerId() !== layerId || !layer || !layer.visible || layer.locked) return;

    const pos = getCanvasPos(canvas, e);
    isDrawing = true;
    start = pos;
    if (currentTool === 'pen') {
      drawLayerObjects[layerId].push({
        type: 'pen',
        points: [pos],
        color: drawColor,
        width: drawWidth
      });
    }
    if (currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        drawLayerObjects[layerId].push({
          type: 'text',
          points: [pos],
          color: drawColor,
          width: drawWidth,
          text
        });
        renderDrawLayer(layerId);
      }
      isDrawing = false;
    }
  };

  canvas.onmousemove = (e) => {
    if (!isDrawing) return;
    const layers = getDrawLayers();
    const layer = layers.find(l => l.id === layerId);
    if (getActiveDrawLayerId() !== layerId || !layer || !layer.visible || layer.locked) return;

    const pos = getCanvasPos(canvas, e);
    if (currentTool === 'pen') {
      let arr = drawLayerObjects[layerId];
      arr[arr.length - 1].points.push(pos);
      renderDrawLayer(layerId);
    } else {
      renderDrawLayer(layerId);
      previewShape(canvas.getContext('2d'), start, pos);
    }
  };

  canvas.onmouseup = (e) => {
    if (!isDrawing) return;
    const layers = getDrawLayers();
    const layer = layers.find(l => l.id === layerId);
    if (getActiveDrawLayerId() !== layerId || !layer || !layer.visible || layer.locked) return;

    const pos = getCanvasPos(canvas, e);
    if (['line', 'rectangle', 'ellipse', 'arrow'].includes(currentTool)) {
      drawLayerObjects[layerId].push({
        type: currentTool,
        points: [start, pos],
        color: drawColor,
        width: drawWidth
      });
      renderDrawLayer(layerId); // Only redraw the layer, do NOT re-render all canvases!
    }
    isDrawing = false;
    // DO NOT call renderDrawCanvases or change activeDrawLayerId here!
    // The active layer remains unchanged.
  };

  // Eraser: click to erase objects
  canvas.onclick = (e) => {
    if (currentTool !== 'eraser') return;
    const layers = getDrawLayers();
    const layer = layers.find(l => l.id === layerId);
    if (getActiveDrawLayerId() !== layerId || !layer || !layer.visible || layer.locked) return;

    const pos = getCanvasPos(canvas, e);
    drawLayerObjects[layerId] = drawLayerObjects[layerId].filter(obj => !isPointOnObject(pos, obj));
    renderDrawLayer(layerId);
  };
}

function renderDrawLayer(layerId) {
  let canvas = drawLayerCanvases[layerId];
  if (!canvas) return;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let objects = drawLayerObjects[layerId] || [];
  objects.forEach(obj => {
    ctx.save();
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = obj.width;
    ctx.fillStyle = obj.color;
    if (obj.type === 'line') line(ctx, obj.points[0], obj.points[1]);
    else if (obj.type === 'rectangle') rectangle(ctx, obj.points[0], obj.points[1]);
    else if (obj.type === 'ellipse') ellipse(ctx, obj.points[0], obj.points[1]);
    else if (obj.type === 'arrow') arrow(ctx, obj.points[0], obj.points[1]);
    else if (obj.type === 'pen') pen(ctx, obj.points);
    else if (obj.type === 'text') {
      ctx.font = `${16 + obj.width * 2}px Inter, Arial, sans-serif`;
      ctx.fillText(obj.text, obj.points[0].x, obj.points[0].y);
    }
    ctx.restore();
  });
}

// Preview shape while dragging
function previewShape(ctx, start, end) {
  ctx.save();
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = drawWidth;
  if (currentTool === 'line') line(ctx, start, end);
  if (currentTool === 'rectangle') rectangle(ctx, start, end);
  if (currentTool === 'ellipse') ellipse(ctx, start, end);
  if (currentTool === 'arrow') arrow(ctx, start, end);
  ctx.restore();
}

function getCanvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Drawing primitives
function line(ctx, a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}
function rectangle(ctx, a, b) {
  ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
}
function ellipse(ctx, a, b) {
  ctx.beginPath();
  ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, 2 * Math.PI);
  ctx.stroke();
}
function arrow(ctx, a, b) {
  line(ctx, a, b);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const headlen = 16;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - headlen * Math.cos(angle - Math.PI / 6), b.y - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - headlen * Math.cos(angle + Math.PI / 6), b.y - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}
function pen(ctx, points) {
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
}

// Eraser hit test (simple bounding box)
function isPointOnObject(pos, obj) {
  if (obj.type === 'text') {
    const p = obj.points[0];
    return Math.abs(pos.x - p.x) < 50 && Math.abs(pos.y - p.y) < 20;
  }
  const allPoints = obj.points || [];
  return allPoints.some(p =>
    Math.abs(pos.x - p.x) < 8 && Math.abs(pos.y - p.y) < 8
  );
}