let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };

export function initScreenshotTool() {
  const screenshotBox = document.getElementById('screenshot-box');
  if (!screenshotBox) {
    console.warn('[Screenshot] screenshot-box not found in DOM.');
    return;
  }

  const dragHandle = screenshotBox.querySelector('.screenshot-drag-handle');
  const resizeDot = screenshotBox.querySelector('.screenshot-resize-dot');
  const watermark = screenshotBox.querySelector('.screenshot-watermark');
  const triggerBtn = document.getElementById('screenshot-btn');
  const cancelBtn = document.getElementById('screenshot-cancel-btn');
  const ratioSelect = document.getElementById('screenshot-ratio');
  const captureBtn = document.getElementById('screenshot-capture-btn');

  if (!dragHandle || !resizeDot || !triggerBtn || !cancelBtn || !ratioSelect || !captureBtn) {
    console.warn('[Screenshot] Missing required elements.');
    return;
  }

  triggerBtn.onclick = () => {
    screenshotBox.classList.remove('hidden');
    setBoxRatio('16:9');
  };

  cancelBtn.onclick = () => {
    screenshotBox.classList.add('hidden');
  };

  ratioSelect.onchange = () => {
    setBoxRatio(ratioSelect.value);
  };

  captureBtn.onclick = () => {
    captureScreenshot();
  };

  dragHandle.onmousedown = startDrag;
  resizeDot.onmousedown = startResize;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', stopInteraction);
}

function setBoxRatio(ratio) {
  const box = document.getElementById('screenshot-box');
  const canvasArea = document.querySelector('.canvas-area');
  if (!box || !canvasArea) return;

  const canvasRect = canvasArea.getBoundingClientRect();
  let width = 480;
  let height = 270;

  switch (ratio) {
    case '1:1': width = 400; height = 400; break;
    case '4:5': width = 400; height = 500; break;
    case '3:2': width = 480; height = 320; break;
  }

  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
  box.style.left = `${canvasRect.left + canvasRect.width / 2}px`;
  box.style.top = `${canvasRect.top + canvasRect.height / 2}px`;
  box.style.transform = 'translate(-50%, -50%)';
}

function startDrag(e) {
  const box = document.getElementById('screenshot-box');
  if (!box) return;
  isDragging = true;
  const rect = box.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
}

function startResize(e) {
  isResizing = true;
  e.preventDefault();
}

function onMouseMove(e) {
  const box = document.getElementById('screenshot-box');
  if (!box) return;

  if (isDragging) {
    box.style.left = `${e.clientX - dragOffset.x}px`;
    box.style.top = `${e.clientY - dragOffset.y}px`;
    box.style.transform = '';
  }

  if (isResizing) {
    const rect = box.getBoundingClientRect();
    const newWidth = Math.max(100, e.clientX - rect.left);
    const newHeight = Math.max(100, e.clientY - rect.top);
    box.style.width = `${newWidth}px`;
    box.style.height = `${newHeight}px`;
  }
}

function stopInteraction() {
  isDragging = false;
  isResizing = false;
}

function captureScreenshot() {
  const box = document.getElementById('screenshot-box');
  if (!box || !window.html2canvas) {
    console.warn('[Screenshot] screenshot-box or html2canvas missing.');
    return;
  }

  const boxRect = box.getBoundingClientRect();

  window.html2canvas(document.body, {
    x: Math.floor(boxRect.left),
    y: Math.floor(boxRect.top),
    width: Math.floor(boxRect.width),
    height: Math.floor(boxRect.height),
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    backgroundColor: null,
    removeContainer: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'screenshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error('[Screenshot] Capture failed:', err);
  });
}
