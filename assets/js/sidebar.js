// Handles sidebar logic, photo upload, drag-n-drop reorder, draw layers management with visibility and lock

let layers = [];
let canvasPhotos = [];
let drawLayers = []; // Each: { id, name, visible, locked }
let activeDrawLayerId = null;

export function getLayers() { return layers; }
export function getCanvasPhotos() { return canvasPhotos; }
export function setCanvasPhotos(photos) { canvasPhotos = photos; }
export function getDrawLayers() { return drawLayers; }
export function getActiveDrawLayerId() { return activeDrawLayerId; }

export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const canvas = document.getElementById('canvas');
  const resizer = document.getElementById('sidebar-resizer');

  // --- Draw Layers Section ---
  const drawLayersDiv = document.getElementById('sidebar-draw-layers');
  const drawAddBtn = document.getElementById('draw-layer-add-btn');
  const drawClearBtn = document.getElementById('draw-layer-clear-btn');

  drawAddBtn.onclick = () => {
    const id = `draw-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
    drawLayers.push({
      id,
      name: `Draw Layer ${drawLayers.length + 1}`,
      visible: true,
      locked: false
    });
    activeDrawLayerId = id;
    renderDrawLayers();
    window.dispatchEvent(new CustomEvent('draw-layer-added', { detail: { id } }));
  };

  drawClearBtn.onclick = () => {
    drawLayers.length = 0;
    activeDrawLayerId = null;
    renderDrawLayers();
    window.dispatchEvent(new CustomEvent('draw-layers-cleared'));
  };

  function renderDrawLayers() {
    drawLayersDiv.innerHTML = '';
    drawLayers.forEach((layer, idx) => {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'sidebar-draw-layer' + (activeDrawLayerId === layer.id ? ' active' : '');
      layerDiv.draggable = true;
      layerDiv.dataset.idx = idx;
      layerDiv.dataset.id = layer.id;

      const rankSpan = document.createElement('span');
      rankSpan.className = 'layer-rank';
      rankSpan.textContent = idx + 1;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'layer-icon material-icons';
      iconSpan.textContent = 'layers';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'layer-name';
      nameSpan.textContent = layer.name;

      const eyeBtn = document.createElement('button');
      eyeBtn.className = 'layer-eye-btn';
      eyeBtn.title = layer.visible ? 'Hide layer' : 'Show layer';
      eyeBtn.innerHTML = `<span class="material-icons">${layer.visible ? 'visibility' : 'visibility_off'}</span>`;
      eyeBtn.onclick = (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        renderDrawLayers();
        window.dispatchEvent(new CustomEvent('draw-layer-visibility', {
          detail: { id: layer.id, visible: layer.visible }
        }));
      };

      const lockBtn = document.createElement('button');
      lockBtn.className = 'layer-lock-btn';
      lockBtn.title = layer.locked ? 'Unlock layer' : 'Lock layer';
      lockBtn.innerHTML = `<span class="material-icons">${layer.locked ? 'lock' : 'lock_open'}</span>`;
      lockBtn.onclick = (e) => {
        e.stopPropagation();
        layer.locked = !layer.locked;
        renderDrawLayers();
        window.dispatchEvent(new CustomEvent('draw-layer-lock', {
          detail: { id: layer.id, locked: layer.locked }
        }));
      };

      layerDiv.onclick = () => {
        if (!layer.locked) {
          activeDrawLayerId = layer.id;
          renderDrawLayers();
          window.dispatchEvent(new CustomEvent('draw-layer-activated', { detail: { id: layer.id } }));
        }
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'layer-delete-btn';
      delBtn.title = 'Delete this draw layer';
      delBtn.innerHTML = `<span class="material-icons">delete</span>`;
      delBtn.onclick = (e) => {
        e.stopPropagation();
        drawLayers.splice(idx, 1);
        if (activeDrawLayerId === layer.id) {
          activeDrawLayerId = drawLayers.length ? drawLayers[drawLayers.length - 1].id : null;
        }
        renderDrawLayers();
        window.dispatchEvent(new CustomEvent('draw-layer-deleted', { detail: { id: layer.id } }));
      };

      // Drag-and-drop events
      layerDiv.addEventListener('dragstart', e => {
        layerDiv.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
      });
      layerDiv.addEventListener('dragend', () => {
        layerDiv.classList.remove('dragging');
      });
      layerDiv.addEventListener('dragover', e => {
        e.preventDefault();
        layerDiv.classList.add('drag-over');
      });
      layerDiv.addEventListener('dragleave', () => {
        layerDiv.classList.remove('drag-over');
      });
      layerDiv.addEventListener('drop', e => {
        e.preventDefault();
        layerDiv.classList.remove('drag-over');
        const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (draggedIdx !== idx) {
          const moved = drawLayers.splice(draggedIdx, 1)[0];
          drawLayers.splice(idx, 0, moved);
          renderDrawLayers();
          window.dispatchEvent(new CustomEvent('draw-layers-reordered', {
            detail: { order: drawLayers.map(l => l.id) }
          }));
        }
      });

      layerDiv.append(rankSpan, iconSpan, nameSpan, eyeBtn, lockBtn, delBtn);
      drawLayersDiv.appendChild(layerDiv);
    });
  }

  renderDrawLayers();

  window.addEventListener('refresh-draw-layer-ui', () => {
  renderDrawLayers();
});


  // --- Image Layers Section ---
  const imageSection = document.getElementById('sidebar-image-section');
  const layersDiv = document.getElementById('sidebar-layers');
  const uploadButton = document.getElementById('photo-upload');
  const imageAddBtn = document.getElementById('image-layer-add-btn');
  const imageClearBtn = document.getElementById('image-layer-clear-btn');

  imageAddBtn.onclick = () => {
    layers.forEach(layer => {
      window.dispatchEvent(new CustomEvent('add-photo-to-canvas', {
        detail: { imgSrc: layer.imgSrc, name: layer.name }
      }));
    });
  };

  imageClearBtn.onclick = () => {
    layers.length = 0;
    canvasPhotos.length = 0;
    renderLayers();
    window.dispatchEvent(new CustomEvent('clear-canvas'));
  };

  uploadButton?.addEventListener('change', function (event) {
    Array.from(event.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function (e) {
        layers.push({ imgSrc: e.target.result, name: file.name });
        renderLayers();
      };
      reader.readAsDataURL(file);
    });
  });

  function renderLayers() {
    layersDiv.innerHTML = '';
    layers.forEach((layer, idx) => {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'photo-layer';
      layerDiv.draggable = true;
      layerDiv.dataset.idx = idx;

      const countSpan = document.createElement('span');
      countSpan.className = 'layer-count';
      countSpan.textContent = idx + 1;

      const plusBtn = document.createElement('button');
      plusBtn.className = 'add-to-canvas';
      plusBtn.innerHTML = '<span class="material-icons">add</span>';
      plusBtn.title = 'Add to canvas';
      plusBtn.onclick = (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('add-photo-to-canvas', {
          detail: { imgSrc: layer.imgSrc, name: layer.name }
        }));
      };

      const cropBtn = document.createElement('button');
      cropBtn.className = 'crop-photo';
      cropBtn.innerHTML = '<span class="material-icons">crop</span>';
      cropBtn.title = 'Crop photo';
      cropBtn.onclick = (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('crop-photo', {
          detail: { imgSrc: layer.imgSrc, name: layer.name }
        }));
      };

      const img = document.createElement('img');
      img.src = layer.imgSrc;
      img.alt = layer.name;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'layer-name';
      nameSpan.textContent = layer.name;

      // Drag events
      layerDiv.addEventListener('dragstart', e => {
        layerDiv.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
      });

      layerDiv.addEventListener('dragend', () => {
        layerDiv.classList.remove('dragging');
      });

      layerDiv.addEventListener('dragover', e => {
        e.preventDefault();
        layerDiv.classList.add('drag-over');
      });

      layerDiv.addEventListener('dragleave', () => {
        layerDiv.classList.remove('drag-over');
      });

      layerDiv.addEventListener('drop', e => {
        e.preventDefault();
        layerDiv.classList.remove('drag-over');
        const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (draggedIdx !== idx) {
          const moved = layers.splice(draggedIdx, 1)[0];
          layers.splice(idx, 0, moved);
          renderLayers();
          window.dispatchEvent(new CustomEvent('sync-canvas-order', {
            detail: { newOrder: layers.map(l => l.name) }
          }));
        }
      });

      layerDiv.append(countSpan, plusBtn, cropBtn, img, nameSpan);
      layersDiv.appendChild(layerDiv);
    });
  }

  renderLayers();
}
