// flashPopup.js
export function initFlash() {
  const hasSeenPopup = localStorage.getItem('hasSeenFlashPopup');
  if (hasSeenPopup) return;

  const popup = document.createElement('div');
  popup.id = 'flash-popup';
  popup.className = 'flash-popup';

  popup.innerHTML = `
    <div class="flash-card">
      <img src="assets/images/workspace-preview.jpg" alt="Workspace Preview" class="flash-image" />
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
