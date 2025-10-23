// notes.js

export function addNoteToBoard(board) {
  board.style.cursor = "crosshair";

  function onClick(e) {
    const boardRect = board.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;

    // Create note container
    const note = document.createElement("div");
    note.classList.add("text-note");
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;

    // Editable content
    const content = document.createElement("div");
    content.classList.add("note-content");
    content.contentEditable = true;
    content.innerText = "New note";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("note-delete");
    deleteBtn.innerText = "✖";
    deleteBtn.title = "Delete note";

    deleteBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      note.remove();
    });

    note.appendChild(content);
    note.appendChild(deleteBtn);
    board.appendChild(note);

    makeNoteDraggable(note);

    board.style.cursor = "default";
    board.removeEventListener("click", onClick);
    content.focus();
  }

  board.addEventListener("click", onClick);
}

// Makes a note draggable.
function makeNoteDraggable(note) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  note.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("note-delete")) return;
    isDragging = true;
    offsetX = e.clientX - note.offsetLeft;
    offsetY = e.clientY - note.offsetTop;
    note.classList.add("dragging");
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    note.style.left = `${e.clientX - offsetX}px`;
    note.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      note.classList.remove("dragging");
    }
  });
}