const API_URL = 'http://localhost:5283'; // produção: https://api.financeapi.com.br
const SPA_ORIGIN = 'http://localhost:4200';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ADD_PRODUCT') {
    resolveToken()
      .then(token => token
        ? addProduct(message.url, token)
        : { success: false, error: 'Faça login no PriceWatch primeiro' })
      .then(async res => {
        if (res.success) await saveTracked(message.url);
        sendResponse(res);
      });
    return true;
  }
});

// Tenta obter o token: primeiro do storage, depois da aba do SPA (se aberta)
async function resolveToken() {
  const { pw_user } = await chrome.storage.local.get('pw_user');
  if (pw_user?.token) return pw_user.token;

  const tabs = await chrome.tabs.query({ url: `${SPA_ORIGIN}/*` });
  if (!tabs.length) return null;

  const results = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => {
      try {
        const u = JSON.parse(localStorage.getItem('pw_user') ?? 'null');
        return u ?? null;
      } catch { return null; }
    },
  });

  const user = results?.[0]?.result;
  if (user?.token) {
    await chrome.storage.local.set({ pw_user: user });
    return user.token;
  }
  return null;
}

async function saveTracked(url) {
  const { tracked = [] } = await chrome.storage.local.get('tracked');
  if (!tracked.includes(url)) {
    await chrome.storage.local.set({ tracked: [...tracked, url] });
  }
}

async function addProduct(url, token) {
  try {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url, targetPrice: 0 }),
    });

    if (res.ok) return { success: true };

    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.message || `Erro ${res.status}` };
  } catch {
    return { success: false, error: 'Não foi possível conectar ao PriceWatch' };
  }
}
