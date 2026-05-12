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

async function injectButton() {
  if (document.getElementById(BUTTON_ID)) return;

  const buyBox = findBuyBox();
  if (!buyBox) return;

  const url = getProductUrl();
  const { tracked = [] } = await chrome.storage.local.get('tracked');
  const alreadyTracked = tracked.includes(url);

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;

  Object.assign(btn.style, {
    width: '100%',
    marginTop: '8px',
    padding: '13px 16px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: '"Proxima Nova", -apple-system, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    transition: 'background 0.15s',
  });

  if (alreadyTracked) {
    btn.textContent = '✓ Já monitorando no PriceWatch';
    btn.disabled = true;
    Object.assign(btn.style, {
      background: '#e8f5e9',
      border: '1px solid #00A650',
      color: '#00A650',
      cursor: 'default',
    });
  } else {
    btn.textContent = 'Acompanhar com PriceWatch';
    Object.assign(btn.style, {
      background: '#ffffff',
      border: '1px solid #3483FA',
      color: '#3483FA',
      cursor: 'pointer',
    });
    btn.addEventListener('mouseenter', () => { btn.style.background = '#EAF0FB'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#ffffff'; });
    btn.addEventListener('click', handleTrack);
  }

  buyBox.appendChild(btn);
}

// ── Ação ao clicar ──────────────────────────────────────────────────────────

function handleTrack() {
  const btn = document.getElementById(BUTTON_ID);
  setLoading(btn, true);

  chrome.runtime.sendMessage({ type: 'ADD_PRODUCT', url: getProductUrl() }, res => {
    setLoading(btn, false);
    if (res?.success) {
      btn.textContent = '✓ Já monitorando no PriceWatch';
      btn.disabled = true;
      Object.assign(btn.style, {
        background: '#e8f5e9', border: '1px solid #00A650',
        color: '#00A650', cursor: 'default', opacity: '1',
      });
    } else if (res?.error?.includes('login')) {
      showFeedback(btn, '⚠️ Faça login no PriceWatch primeiro', 'warn');
    } else {
      showFeedback(btn, `✕ ${res?.error ?? 'Erro desconhecido'}`, 'error');
    }
  });
}

// ── Helpers de UI ───────────────────────────────────────────────────────────

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Adicionando...' : 'Acompanhar com PriceWatch';
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
      btn.textContent = 'Acompanhar com PriceWatch';
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
