const API_URL = 'http://localhost:5283'; // produção: https://api.financeapi.com.br

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ADD_PRODUCT') {
    addProduct(message.url, message.token).then(sendResponse);
    return true; // indica resposta assíncrona
  }
});

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
