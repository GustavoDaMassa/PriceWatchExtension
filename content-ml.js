const BUTTON_ID = 'pw-track-btn';

// ── Selectors (ML usa Andes UI) ─────────────────────────────────────────────

const BUY_BOX_SELECTORS = [
  '.ui-pdp-actions__container',
  '.ui-pdp-buybox',
];

function findBuyBox() {
  for (const sel of BUY_BOX_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// ── Produto URL (usa canonical para remover tracking params) ────────────────

function getProductUrl() {
  return document.querySelector('link[rel="canonical"]')?.href
    ?? window.location.href.split('?')[0];
}

// ── Injeção do botão ────────────────────────────────────────────────────────

function injectButton() {
  if (document.getElementById(BUTTON_ID)) return;

  const buyBox = findBuyBox();
  if (!buyBox) return;

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = '⭐ Acompanhar com PriceWatch';

  Object.assign(btn.style, {
    width: '100%',
    marginTop: '8px',
    padding: '13px 16px',
    background: '#ffffff',
    border: '1px solid #3483FA',
    borderRadius: '6px',
    color: '#3483FA',
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: '"Proxima Nova", -apple-system, sans-serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    transition: 'background 0.15s',
  });

  btn.addEventListener('mouseenter', () => { btn.style.background = '#EAF0FB'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#ffffff'; });
  btn.addEventListener('click', handleTrack);

  buyBox.appendChild(btn);
}

// ── Ação ao clicar ──────────────────────────────────────────────────────────

async function handleTrack() {
  const btn = document.getElementById(BUTTON_ID);

  const { pw_user } = await chrome.storage.local.get('pw_user');

  if (!pw_user?.token) {
    showFeedback(btn, '⚠️ Faça login no PriceWatch primeiro', 'warn');
    return;
  }

  setLoading(btn, true);

  const url = getProductUrl();

  chrome.runtime.sendMessage({ type: 'ADD_PRODUCT', url, token: pw_user.token }, res => {
    setLoading(btn, false);
    if (res?.success) {
      showFeedback(btn, '✓ Adicionado ao PriceWatch!', 'success');
    } else {
      showFeedback(btn, `✕ ${res?.error ?? 'Erro desconhecido'}`, 'error');
    }
  });
}

// ── Helpers de UI ───────────────────────────────────────────────────────────

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Adicionando...' : '⭐ Acompanhar com PriceWatch';
  btn.style.opacity = loading ? '0.7' : '1';
  btn.style.cursor = loading ? 'not-allowed' : 'pointer';
}

function showFeedback(btn, text, type) {
  const colors = {
    success: { bg: '#e8f5e9', border: '#00A650', color: '#00A650' },
    error:   { bg: '#fdecea', border: '#F23D4F', color: '#F23D4F' },
    warn:    { bg: '#FFF9E6', border: '#E6A817', color: '#E6A817' },
  };
  const c = colors[type];
  btn.textContent = text;
  btn.style.background = c.bg;
  btn.style.borderColor = c.border;
  btn.style.color = c.color;

  setTimeout(() => {
    if (type !== 'success') {
      btn.textContent = '⭐ Acompanhar com PriceWatch';
      btn.style.background = '#ffffff';
      btn.style.borderColor = '#3483FA';
      btn.style.color = '#3483FA';
    }
  }, 3000);
}

// ── Observer (ML é SPA — navega sem recarregar a página) ───────────────────

function tryInject() {
  if (!document.getElementById(BUTTON_ID)) injectButton();
}

const observer = new MutationObserver(tryInject);
observer.observe(document.body, { childList: true, subtree: true });

tryInject();
