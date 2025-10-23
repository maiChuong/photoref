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
  const layersDiv = document.getElementById('sidebar-layers');
  const uploadButton = document.getElementById('photo-upload');
  const sidebarDrawSection = document.getElementById('sidebar-draw-section');
  const drawLayersDiv = document.getElementById('sidebar-draw-layers');
  const drawAddBtn = document.getElementById('draw-layer-add-btn');
  const drawClearBtn = document.getElementById('draw-layer-clear-btn');
  const sidebarTitle = document.getElementById('sidebar-title');
  const resizer = document.getElementById('sidebar-resizer');
  const canvas = document.getElementById('canvas');

  // --- Draw Layer Section ---
  drawAddBtn.onclick = () => {
    const id = `draw-${Date.now()}-${Math.floor(Math.random()*1e5)}`;
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

      // Layer order/rank
      const rankSpan = document.createElement('span');
      rankSpan.className = 'layer-rank';
      rankSpan.textContent = idx + 1;

      // Layer icon
      const iconSpan = document.createElement('span');
      iconSpan.className = 'layer-icon material-icons';
      iconSpan.textContent = 'layers';

      // Name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'layer-name';
      nameSpan.textContent = layer.name;

      // Eye icon for visibility
      const eyeBtn = document.createElement('button');
      eyeBtn.className = 'layer-eye-btn';
      eyeBtn.title = layer.visible ? 'Hide layer' : 'Show layer';
      eyeBtn.innerHTML = `<span class="material-icons">${layer.visible ? 'visibility' : 'visibility_off'}</span>`;
      eyeBtn.onclick = (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        renderDrawLayers();
        window.dispatchEvent(new CustomEvent('draw-layer-visibility', { detail: { id: layer.id, visible: layer.visible } }));
      };

      // Lock icon for lock/unlock
      const lockBtn = document.createElement('button');
      lockBtn.className = 'layer-lock-btn';
      lockBtn.title = layer.locked ? 'Unlock layer' : 'Lock layer';
      lockBtn.innerHTML = `<span class="material-icons">${layer.locked ? 'lock' : 'lock_open'}</span>`;
      lockBtn.onclick = (e) => {
        e.stopPropagation();
        layer.locked = !layer.locked;
        renderDrawLayers();
        window.dispatchEvent(new CustomEvent('draw-layer-lock', { detail: { id: layer.id, locked: layer.locked } }));
      };

      // Select to activate
      layerDiv.onclick = () => {
        if (!layer.locked) {
          activeDrawLayerId = layer.id;
          renderDrawLayers();
          window.dispatchEvent(new CustomEvent('draw-layer-activated', { detail: { id: layer.id } }));
        }
      };

      // Delete button
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

      // Drag events
      layerDiv.addEventListener('dragstart', e => {
        layerDiv.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
      });
      layerDiv.addEventListener('dragend', e => {
        layerDiv.classList.remove('dragging');
      });
      layerDiv.addEventListener('dragover', e => {
        e.preventDefault();
        layerDiv.classList.add('drag-over');
      });
      layerDiv.addEventListener('dragleave', e => {
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
          window.dispatchEvent(new CustomEvent('draw-layers-reordered', { detail: { order: drawLayers.map(l => l.id) } }));
        }
      });

      layerDiv.appendChild(rankSpan);
      layerDiv.appendChild(iconSpan);
      layerDiv.appendChild(nameSpan);
      layerDiv.appendChild(eyeBtn);
      layerDiv.appendChild(lockBtn);
      layerDiv.appendChild(delBtn);

      drawLayersDiv.appendChild(layerDiv);
    });
  }
  renderDrawLayers();

  // --- Existing Photo Layers Section ---
  sidebarTitle.style.display = "inline-flex";
  sidebarTitle.style.alignItems = "center";
  sidebarTitle.style.gap = "8px";

  let addAllBtn = document.createElement('button');
  addAllBtn.className = 'sidebar-addall-btn';
  addAllBtn.title = "Add all layers to canvas";
  addAllBtn.innerHTML = `<span class="material-icons">add</span>`;

  let clearBtn = document.createElement('button');
  clearBtn.className = 'sidebar-clear-btn';
  clearBtn.title = "Clear all layers and canvas";
  clearBtn.innerHTML = `<span class="material-icons">delete_sweep</span>`;

  if (!sidebarTitle.querySelector('.sidebar-addall-btn')) {
    sidebarTitle.appendChild(addAllBtn);
  }
  if (!sidebarTitle.querySelector('.sidebar-clear-btn')) {
    sidebarTitle.appendChild(clearBtn);
  }

  addAllBtn.onclick = () => {
    layers.forEach(layer => {
      window.dispatchEvent(new CustomEvent('add-photo-to-canvas', {
        detail: { imgSrc: layer.imgSrc, name: layer.name }
      }));
    });
  };
  clearBtn.onclick = () => {
    layers.length = 0;
    canvasPhotos.length = 0;
    renderLayers();
    window.dispatchEvent(new CustomEvent('clear-canvas'));
  };

  // Sidebar toggle/resizer
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');
  sidebarToggle.style.position = "fixed";
  sidebarToggle.style.top = "12px";
  sidebarToggle.style.left = "0px";
  sidebarToggle.style.zIndex = "1100";
  sidebarToggleIcon.innerHTML = '&#9776;';

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('closed');
    sidebarToggleIcon.innerHTML = sidebar.classList.contains('closed') ? '&#9654;' : '&#9776;';
  });

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  resizer.addEventListener('mousedown', function(e) {
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  });

  window.addEventListener('mousemove', function(e) {
    if (!isResizing) return;
    let newWidth = startWidth + (e.clientX - startX);
    newWidth = Math.max(120, Math.min(window.innerWidth / 2, newWidth));
    sidebar.style.width = newWidth + 'px';
    canvas.style.marginLeft = sidebar.classList.contains('closed') ? "0px" : newWidth + 'px';
  });

  window.addEventListener('mouseup', function() {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
    }
  });

  // Photo upload
  uploadButton.addEventListener('change', function (event) {
    Array.from(event.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        layers.push({ imgSrc: e.target.result, name: file.name });
        renderLayers();
      };
      reader.readAsDataURL(file);
    });
  });

  // Layer drag-and-drop logic and canvas sync
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
      plusBtn.style.width = '22px';
      plusBtn.style.height = '22px';

      plusBtn.onclick = (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('add-photo-to-canvas', {
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
      layerDiv.addEventListener('dragend', e => {
        layerDiv.classList.remove('dragging');
      });
      layerDiv.addEventListener('dragover', e => {
        e.preventDefault();
        layerDiv.classList.add('drag-over');
      });
      layerDiv.addEventListener('dragleave', e => {
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
          window.dispatchEvent(new CustomEvent('sync-canvas-order', { detail: { newOrder: layers.map(l => l.name) } }));
        }
      });

      layerDiv.appendChild(countSpan);
      layerDiv.appendChild(plusBtn);
      layerDiv.appendChild(img);
      layerDiv.appendChild(nameSpan);

      layersDiv.appendChild(layerDiv);
    });
  }
  renderLayers();
}