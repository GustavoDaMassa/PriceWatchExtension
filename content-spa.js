// Runs on the PriceWatch SPA — syncs the auth token to chrome.storage
// so content-ml.js can read it while on Mercado Livre pages.

function syncToken() {
  const stored = localStorage.getItem('pw_user');
  if (stored) {
    try {
      chrome.storage.local.set({ pw_user: JSON.parse(stored) });
    } catch {}
  } else {
    chrome.storage.local.remove('pw_user');
  }
}

syncToken();

window.addEventListener('storage', e => {
  if (e.key === 'pw_user') syncToken();
});
