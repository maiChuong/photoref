// flashPopup.js
export function initFlash() {
  const hasSeenPopup = localStorage.getItem('hasSeenFlashPopup');
  if (hasSeenPopup) return;

  // ✅ Configuration: toggle image and video display
  const showImage = true;
  const showVideo = true;

  const popup = document.createElement('div');
  popup.id = 'flash-popup';
  popup.className = 'flash-popup';

  // ✅ Build media section dynamically
  let mediaHTML = '';
  if (showImage) {
    mediaHTML += `
      <img src="assets/images/draw-logo.svg" alt="Workspace Preview" class="flash-image" />
    `;
  }
  if (showVideo) {
    mediaHTML += `
      <div class="flash-video">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Welcome Video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  popup.innerHTML = `
    <div class="flash-card">
      <div class="flash-media">${mediaHTML}</div>
      <div class="flash-content">
        <h2>Welcome to PhotoRef Studio</h2>
        <p>Start your creative journey by accessing your workspace.</p>
        <div class="flash-actions">
          <button id="flash-access-btn" class="flash-btn access">Access Workspace</button>
          <button id="flash-cancel-btn" class="flash-btn cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById('flash-access-btn')?.addEventListener('click', () => {
    popup.remove();
    localStorage.setItem('hasSeenFlashPopup', 'true');
    // Optionally trigger workspace logic here
  });

  document.getElementById('flash-cancel-btn')?.addEventListener('click', () => {
    popup.remove();
    localStorage.setItem('hasSeenFlashPopup', 'true');
  });
}
