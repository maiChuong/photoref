import {
  addPhotoToCanvas,
  deleteTopPhoto,
  zoomIn,
  zoomOut,
  bringTopToFront,
  focusTopPhoto
} from './canvas.js';

import { addNoteToBoard } from './notes.js';

export function initControls() {
  const controlPanel = document.getElementById('control-panel');
  const canvasArea = document.querySelector('.canvas-area');

  const buttons = [
    { text: 'Upload', fn: openUpload },
    { text: 'Print', fn: () => printCanvas(canvasArea) },
    { text: 'Zoom +', fn: zoomIn },
    { text: 'Zoom -', fn: zoomOut },
    { text: 'Top', fn: bringTopToFront },
    { text: 'Focus', fn: focusTopPhoto },
    { text: 'Delete', fn: deleteTopPhoto },
    { text: 'Notes+', fn: () => addNoteToBoard(canvasArea) }
  ];

  Array.from(controlPanel.children).forEach((btn, idx) => {
    if (buttons[idx]) {
      btn.onclick = buttons[idx].fn;
    }
  });
}

function openUpload() {
  const uploadInput = document.getElementById('photo-upload');
  if (uploadInput) uploadInput.click();
}

// Prints only the canvas area
function printCanvas(canvasArea) {
  // Clone the canvas area
  const printContents = canvasArea.cloneNode(true);

  // Remove controls or non-canvas elements if any
  printContents.querySelectorAll('.canvas-photo.rotate-dot, .canvas-photo.resize-dot, .focus-dashbox, .focus-mask, .text-note.dragging').forEach(el => el.remove());

  // Create a new print window
  const printWindow = window.open('', '', 'width=1024,height=768');
  printWindow.document.write(`
    <html>
    <head>
      <title>Print Canvas</title>
      <style>
        body { margin:0; }
        .canvas-area {
          width: 100vw;
          height: 100vh;
          position: relative;
          background: #fafafa;
          border-radius: 0;
          box-shadow: none;
        }
        .canvas-photo {
          position: absolute;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 2px solid transparent;
        }
        .text-note {
          position: absolute;
          min-width: 120px;
          min-height: 40px;
          background: #ffffcc;
          border: 1px solid #ffd700;
          border-radius: 6px;
          padding: 6px 28px 6px 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          font-size: 1em;
        }
        .note-content { outline: none; min-height: 24px; padding-right: 18px; word-break: break-word; }
        .note-delete { display: none; }
      </style>
    </head>
    <body></body>
    </html>
  `);

  printWindow.document.body.appendChild(printContents);
  printWindow.document.close();

  // Wait for DOM to render, then print
  printWindow.onload = function() {
    printWindow.focus();
    printWindow.print();
    // Optionally close the window after printing
    // printWindow.close();
  };
}