// canvas.js: Canvas rendering, drag, select, rotate, resize, focus crop (draw/crop dashbox), layer badge
// Lower index is bottommost, higher index is topmost; selected photo shows layer position

let canvasPhotos = [];
let zoomLevel = 1;
let selectedIdx = null;

// Drag/rotate/resize states
let draggingPhotoIdx = null;
let dragOffset = { x: 0, y: 0 };
let dragStartPos = { x: 0, y: 0 };
let resizingPhoto = false;
let rotatingPhoto = false;
let rotateStartAngle = 0;
let rotateStartPos = { x: 0, y: 0 };
let initialRotation = 0;

// Focus crop (draw/crop dashbox)
let croppingMode = false;
let cropDashbox = null;
let cropStart = null;
let cropEnd = null;
let cropBox = null;

export function initCanvas() {
  const canvasArea = document.querySelector('.canvas-area');
  const maskDiv = document.getElementById('canvas-mask');

  window.addEventListener('add-photo-to-canvas', event => {
    const { imgSrc, name } = event.detail;
    addPhotoToCanvas(imgSrc, name);
  });

  window.addEventListener('clear-canvas', () => {
    canvasPhotos.length = 0;
    selectedIdx = null;
    renderCanvas();
  });

  window.addEventListener('sync-canvas-order', e => {
    const newOrderNames = e.detail.newOrder;
    canvasPhotos = newOrderNames.map(name =>
      canvasPhotos.find(p => p.name === name)
    ).filter(Boolean);
    renderCanvas();
  });

  renderCanvas();

  // Mouse events for drag, select, rotate, resize, crop
  canvasArea.addEventListener('mousedown', function(e) {
    const target = e.target;

    // CROPPING (drawing dashbox by mouse)
    if (croppingMode && selectedIdx !== null && !target.classList.contains('focus-dashbox')) {
      cropStart = getRelativePos(e, canvasArea);
      cropEnd = {...cropStart};
      cropBox = null;
      drawCropDashbox(cropStart, cropEnd);
      document.body.style.cursor = 'crosshair';
      return;
    }

    if (target.classList.contains('canvas-photo')) {
      const idx = parseInt(target.dataset.idx);
      selectedIdx = idx;
      renderCanvas();

      // Rotate handle
      if (target.classList.contains('rotate-dot')) {
        rotatingPhoto = true;
        rotateStartPos = { x: e.clientX, y: e.clientY };
        rotateStartAngle = getRotation(canvasPhotos[selectedIdx]);
        initialRotation = rotateStartAngle;
        document.body.style.cursor = 'grab';
        return;
      }
      // Resize handle
      if (target.classList.contains('resize-dot')) {
        resizingPhoto = true;
        dragStartPos = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'nwse-resize';
        return;
      }

      // Normal drag
      draggingPhotoIdx = idx;
      dragStartPos = { x: e.clientX, y: e.clientY };
      dragOffset = {
        x: e.clientX - canvasPhotos[idx].left,
        y: e.clientY - canvasPhotos[idx].top
      };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'move';
    }

    // Dashbox resize (if croppingMode off)
    if (target.classList.contains('focus-dashbox') && !croppingMode) {
      croppingMode = true;
      cropDashbox = target;
      cropStart = getRelativePos(e, canvasArea);
      cropBox = {
        left: parseInt(target.style.left),
        top: parseInt(target.style.top),
        width: parseInt(target.style.width),
        height: parseInt(target.style.height)
      };
      document.body.style.cursor = 'nwse-resize';
    }
  });

  window.addEventListener('mousemove', function(e) {
    // Drag image
    if (draggingPhotoIdx !== null) {
      const canvasRect = canvasArea.getBoundingClientRect();
      let newLeft = e.clientX - dragOffset.x;
      let newTop = e.clientY - dragOffset.y;
      // Boundaries
      const photo = canvasPhotos[draggingPhotoIdx];
      newLeft = Math.max(0, Math.min(canvasRect.width - photo.width, newLeft));
      newTop = Math.max(0, Math.min(canvasRect.height - photo.height, newTop));
      photo.left = newLeft;
      photo.top = newTop;
      renderCanvas();
    }
    // Resize image
    if (resizingPhoto && selectedIdx !== null) {
      const photo = canvasPhotos[selectedIdx];
      let dx = e.clientX - dragStartPos.x;
      let dy = e.clientY - dragStartPos.y;
      let size = Math.max(40, photo.width + dx, photo.height + dy);
      photo.width = size;
      photo.height = size;
      renderCanvas();
    }
    // Rotate image
    if (rotatingPhoto && selectedIdx !== null) {
      const photo = canvasPhotos[selectedIdx];
      const cx = photo.left + photo.width / 2;
      const cy = photo.top;
      let angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
      photo.rotation = initialRotation + angle;
      renderCanvas();
    }
    // Draw/crop dashbox
    if (croppingMode && cropStart && selectedIdx !== null) {
      cropEnd = getRelativePos(e, canvasArea);
      drawCropDashbox(cropStart, cropEnd);
    }
  });

  window.addEventListener('mouseup', function(e) {
    draggingPhotoIdx = null;
    resizingPhoto = false;
    rotatingPhoto = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Finish cropping
    if (croppingMode && cropStart && cropEnd && selectedIdx !== null) {
      // Compute crop rectangle
      let left = Math.min(cropStart.x, cropEnd.x);
      let top = Math.min(cropStart.y, cropEnd.y);
      let width = Math.abs(cropEnd.x - cropStart.x);
      let height = Math.abs(cropEnd.y - cropStart.y);

      // Crop only inside selected image area
      const photo = canvasPhotos[selectedIdx];
      let imgLeft = photo.left;
      let imgTop = photo.top;
      let imgRight = photo.left + photo.width;
      let imgBottom = photo.top + photo.height;

      left = Math.max(left, imgLeft);
      top = Math.max(top, imgTop);
      let right = Math.min(left + width, imgRight);
      let bottom = Math.min(top + height, imgBottom);
      width = Math.max(40, right - left);
      height = Math.max(40, bottom - top);

      photo.left = left;
      photo.top = top;
      photo.width = width;
      photo.height = height;

      cropDashbox = null;
      cropStart = null;
      cropEnd = null;
      cropBox = null;
      croppingMode = false;
      renderCanvas();
    } else {
      croppingMode = false;
      cropDashbox = null;
      cropStart = null;
      cropEnd = null;
      cropBox = null;
    }
  });

  // Select image by click
  canvasArea.addEventListener('click', function(e) {
    if (e.target.classList.contains('canvas-photo')) {
      selectedIdx = parseInt(e.target.dataset.idx);
      renderCanvas();
    } else {
      selectedIdx = null;
      renderCanvas();
    }
  });
}

// Utility
function getRelativePos(e, el) {
  const rect = el.getBoundingClientRect();
  return {
    x: Math.round(e.clientX - rect.left),
    y: Math.round(e.clientY - rect.top)
  };
}

function drawCropDashbox(start, end) {
  const maskDiv = document.getElementById('canvas-mask');
  maskDiv.innerHTML = '';
  maskDiv.style.display = 'block';

  let left = Math.min(start.x, end.x);
  let top = Math.min(start.y, end.y);
  let width = Math.abs(end.x - start.x);
  let height = Math.abs(end.y - start.y);

  const dashbox = document.createElement('div');
  dashbox.className = 'focus-dashbox';
  dashbox.style.left = left + 'px';
  dashbox.style.top = top + 'px';
  dashbox.style.width = Math.max(40, width) + 'px';
  dashbox.style.height = Math.max(40, height) + 'px';
  dashbox.style.pointerEvents = 'auto';
  maskDiv.appendChild(dashbox);

  const canvasArea = document.querySelector('.canvas-area');
  const canvasRect = canvasArea.getBoundingClientRect();
  const mask = document.createElement('div');
  mask.className = 'focus-mask';
  mask.style.left = '0px';
  mask.style.top = '0px';
  mask.style.width = canvasRect.width + 'px';
  mask.style.height = canvasRect.height + 'px';
  maskDiv.appendChild(mask);
}

function renderCanvas() {
  const canvasArea = document.querySelector('.canvas-area');
  canvasArea.innerHTML = '';

  // Lower index is bottommost, higher index is topmost (rank = idx + 1)
  canvasPhotos.forEach((photo, idx) => {
    // Container for transform
    const photoWrapper = document.createElement('div');
    photoWrapper.style.position = 'absolute';
    photoWrapper.style.left = photo.left + 'px';
    photoWrapper.style.top = photo.top + 'px';
    photoWrapper.style.width = photo.width + 'px';
    photoWrapper.style.height = photo.height + 'px';
    photoWrapper.style.transform = `rotate(${photo.rotation || 0}deg)`;
    photoWrapper.style.transformOrigin = 'center center';

    // Image
    const img = document.createElement('img');
    img.src = photo.imgSrc;
    img.alt = photo.name;
    img.className = 'canvas-photo' + (selectedIdx === idx ? ' selected active' : '');
    img.dataset.idx = idx;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.pointerEvents = 'auto';

    photoWrapper.appendChild(img);

    // If selected, add layer badge, rotate and resize dots
    if (selectedIdx === idx) {
      // Layer position badge
      const layerBadge = document.createElement('span');
      layerBadge.className = 'canvas-layer-badge';
      layerBadge.textContent = `Layer ${idx + 1}`;
      photoWrapper.appendChild(layerBadge);

      // Rotate dot (center top)
      const rotateDot = document.createElement('div');
      rotateDot.className = 'canvas-photo rotate-dot';
      rotateDot.dataset.idx = idx;
      rotateDot.style.position = 'absolute';
      rotateDot.style.left = (photo.width/2 - 8) + 'px';
      rotateDot.style.top = '-15px';
      rotateDot.style.width = '16px';
      rotateDot.style.height = '16px';
      rotateDot.style.background = '#ffe600';
      rotateDot.style.border = '2px solid #007bff';
      rotateDot.style.borderRadius = '50%';
      rotateDot.style.cursor = 'grab';
      rotateDot.style.zIndex = 10;
      photoWrapper.appendChild(rotateDot);

      // Resize dot (bottom right)
      const resizeDot = document.createElement('div');
      resizeDot.className = 'canvas-photo resize-dot';
      resizeDot.dataset.idx = idx;
      resizeDot.style.position = 'absolute';
      resizeDot.style.right = '-10px';
      resizeDot.style.bottom = '-10px';
      resizeDot.style.width = '16px';
      resizeDot.style.height = '16px';
      resizeDot.style.background = '#007bff';
      resizeDot.style.border = '2px solid #fff';
      resizeDot.style.borderRadius = '50%';
      resizeDot.style.cursor = 'nwse-resize';
      resizeDot.style.zIndex = 10;
      photoWrapper.appendChild(resizeDot);
    }

    canvasArea.appendChild(photoWrapper);
  });

  renderFocus();
}

// Add photo to canvas at default position/size
export function addPhotoToCanvas(imgSrc, name) {
  const canvasArea = document.querySelector('.canvas-area');
  const defaultSize = 200 * zoomLevel;
  const left = Math.max(10 + canvasPhotos.length * 30, 0);
  const top = Math.max(10 + canvasPhotos.length * 20, 0);
  canvasPhotos.push({
    imgSrc,
    name,
    left,
    top,
    width: defaultSize,
    height: defaultSize,
    rotation: 0
  });
  selectedIdx = canvasPhotos.length - 1;
  renderCanvas();
}

// Delete selected photo
export function deleteTopPhoto() {
  if (selectedIdx !== null && canvasPhotos[selectedIdx]) {
    canvasPhotos.splice(selectedIdx, 1);
    selectedIdx = null;
    renderCanvas();
  }
}

// Zoom in selected photo
export function zoomIn() {
  if (selectedIdx !== null && canvasPhotos[selectedIdx]) {
    canvasPhotos[selectedIdx].width *= 1.2;
    canvasPhotos[selectedIdx].height *= 1.2;
    renderCanvas();
  }
}

// Zoom out selected photo
export function zoomOut() {
  if (selectedIdx !== null && canvasPhotos[selectedIdx]) {
    canvasPhotos[selectedIdx].width = Math.max(40, canvasPhotos[selectedIdx].width * 0.8);
    canvasPhotos[selectedIdx].height = Math.max(40, canvasPhotos[selectedIdx].height * 0.8);
    renderCanvas();
  }
}

// Bring selected photo to front
export function bringTopToFront() {
  if (selectedIdx !== null && canvasPhotos[selectedIdx]) {
    const photo = canvasPhotos.splice(selectedIdx, 1)[0];
    canvasPhotos.push(photo);
    selectedIdx = canvasPhotos.length - 1;
    renderCanvas();
  }
}

// Focus selected photo: draw dashbox and mask, enable crop mode
export function focusTopPhoto() {
  if (selectedIdx !== null && canvasPhotos[selectedIdx]) {
    croppingMode = true;
    renderFocus(true);
  }
}

function renderFocus(active = false) {
  const maskDiv = document.getElementById('canvas-mask');
  maskDiv.innerHTML = '';
  maskDiv.style.display = active ? 'block' : 'none';
  if (active && selectedIdx !== null && canvasPhotos[selectedIdx]) {
    const canvasArea = document.querySelector('.canvas-area');
    const photo = canvasPhotos[selectedIdx];
    const canvasRect = canvasArea.getBoundingClientRect();

    // Focus dashbox (draw/crop mode)
    const dashbox = document.createElement('div');
    dashbox.className = 'focus-dashbox';
    dashbox.style.left = photo.left + 'px';
    dashbox.style.top = photo.top + 'px';
    dashbox.style.width = photo.width + 'px';
    dashbox.style.height = photo.height + 'px';
    dashbox.style.pointerEvents = 'auto';
    dashbox.style.background = 'rgba(255,255,255,0.01)';
    maskDiv.appendChild(dashbox);

    // Mask
    const mask = document.createElement('div');
    mask.className = 'focus-mask';
    mask.style.left = '0px';
    mask.style.top = '0px';
    mask.style.width = canvasRect.width + 'px';
    mask.style.height = canvasRect.height + 'px';
    maskDiv.appendChild(mask);

    maskDiv.style.clipPath = '';
  } else {
    maskDiv.style.clipPath = '';
  }
}

// Utility to get photo rotation (deg)
function getRotation(photo) {
  return photo.rotation || 0;
}