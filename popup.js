const API_URL = 'https://pricewatch-api.gustavohdev.com.br';

const loginView = document.getElementById('login-view');
const loggedView = document.getElementById('logged-view');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const errorMsg = document.getElementById('error-msg');
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');

async function init() {
  const { pw_user } = await chrome.storage.local.get('pw_user');
  if (pw_user?.token && !isTokenExpired(pw_user.token)) {
    showLoggedIn(pw_user);
  } else {
    if (pw_user) await chrome.storage.local.remove('pw_user');
    showLogin();
  }
}

function showLogin() {
  loginView.classList.remove('hidden');
  loggedView.classList.add('hidden');
}

function showLoggedIn(user) {
  loggedView.classList.remove('hidden');
  loginView.classList.add('hidden');
  userNameEl.textContent = user.name;
  userEmailEl.textContent = user.email;
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

btnLogin.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return;

  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';
  errorMsg.style.display = 'none';

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const user = await res.json();
      await chrome.storage.local.set({ pw_user: user });
      showLoggedIn(user);
    } else {
      const data = await res.json().catch(() => ({}));
      errorMsg.textContent = data.message || 'E-mail ou senha inválidos';
      errorMsg.style.display = 'block';
    }
  } catch {
    errorMsg.textContent = 'Não foi possível conectar ao PriceWatch';
    errorMsg.style.display = 'block';
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
  }
});

passwordInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') btnLogin.click();
});

btnLogout.addEventListener('click', async () => {
  await chrome.storage.local.remove('pw_user');
  emailInput.value = '';
  passwordInput.value = '';
  showLogin();
});

init();
