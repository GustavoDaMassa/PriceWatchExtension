const API_URL = 'https://pricewatch-api.gustavohdev.com.br';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ADD_PRODUCT') {
    resolveToken()
      .then(token => token
        ? addProduct(message.url, token)
        : { success: false, error: 'Faça login no PriceWatch pela extensão' })
      .then(sendResponse);
    return true;
  }
});

async function resolveToken() {
  const { pw_user } = await chrome.storage.local.get('pw_user');
  if (!pw_user?.token) return null;
  try {
    const payload = JSON.parse(atob(pw_user.token.split('.')[1]));
    if (Date.now() >= payload.exp * 1000) {
      await chrome.storage.local.remove('pw_user');
      return null;
    }
  } catch {
    return null;
  }
  return pw_user.token;
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
