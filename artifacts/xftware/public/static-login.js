(() => {
  const labels = ['Login username', 'Login email'];
  const methodButtons = [...document.querySelectorAll('#__next button')].filter((button) =>
    labels.includes(button.textContent.trim()),
  );
  if (methodButtons.length < 2) return;

  const choiceStack = methodButtons[0].closest('.MuiStack-root');
  const screenHost = choiceStack?.parentElement;
  if (!choiceStack || !screenHost) return;

  const siblingStacks = [...screenHost.querySelectorAll(':scope > .MuiStack-root')]
    .filter((stack) => stack !== choiceStack)
    .map((stack) => ({ stack, display: stack.style.display }));

  const state = {
    method: '',
    identity: '',
    password: '',
    step: 'choice',
    token: '',
    tempToken: '',
    twoFactorSecret: '',
    qrImage: '',
    pendingAuthToken: '',
    forgotEmail: '',
    forgotCode: '',
    newPassword: '',
    confirmPassword: '',
    requiresTwoFactor: false,
    setupOrigin: 'forced',
  };

  const style = document.createElement('style');
  style.textContent = `
    .xoftware-auth-panel { display:flex; flex-direction:column; gap:16px; width:100%; color:#172033; }
    .xoftware-auth-back { align-self:flex-start; padding:4px 0; border:0; background:transparent; color:#475569; font:500 14px Inter, sans-serif; cursor:pointer; }
    .xoftware-auth-title { margin:0 0 4px; text-align:center; color:#172033; font:700 24px/1.35 Inter, sans-serif; }
    .xoftware-auth-form { display:flex; flex-direction:column; gap:14px; }
    .xoftware-auth-label { display:flex; flex-direction:column; gap:7px; color:#334155; font:500 14px Inter, sans-serif; }
    .xoftware-auth-input { box-sizing:border-box; width:100%; min-height:48px; padding:12px 14px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; color:#0f172a; font:400 16px Inter, sans-serif; }
    .xoftware-auth-input:focus { border-color:#6366f1; outline:3px solid rgba(99,102,241,.15); }
    .xoftware-auth-primary,.xoftware-auth-secondary { min-height:45px; border-radius:6px; font:600 14px Inter, sans-serif; cursor:pointer; }
    .xoftware-auth-primary { border:0; background:#6366f1; color:#fff; }
    .xoftware-auth-primary:hover { background:#4f46e5; }
    .xoftware-auth-secondary { border:1px solid #cbd5e1; background:#fff; color:#334155; }
    .xoftware-auth-primary:disabled,.xoftware-auth-secondary:disabled { cursor:wait; opacity:.65; }
    .xoftware-auth-message { margin:0; color:#b42318; font:400 14px/1.5 Inter, sans-serif; }
    .xoftware-auth-message[data-kind="success"] { color:#15803d; }
    .xoftware-auth-message[data-kind="info"] { color:#475569; }
    .xoftware-auth-help { margin:0; color:#64748b; font:400 13px/1.5 Inter, sans-serif; }
    .xoftware-auth-link { align-self:flex-end; padding:0; border:0; background:transparent; color:#4f46e5; font:500 13px Inter, sans-serif; cursor:pointer; }
    .xoftware-auth-qr { display:block; width:190px; height:190px; max-width:100%; object-fit:contain; align-self:center; }
    .xoftware-auth-secret { padding:10px; border-radius:6px; background:#f1f5f9; color:#334155; font:600 14px/1.5 monospace; text-align:center; overflow-wrap:anywhere; }
    .xoftware-auth-captcha { display:flex; justify-content:center; min-height:66px; }
  `;
  document.head.append(style);

  const panel = document.createElement('section');
  panel.className = 'xoftware-auth-panel';
  panel.style.display = 'none';
  panel.setAttribute('aria-live', 'polite');

  const originalChoiceDisplay = choiceStack.style.display;
  const apiRoot = (() => {
    const host = window.location.hostname;
    const isPreview =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.replit.dev');
    return isPreview
      ? '/__xoftware_api'
      : 'https://backend-s2.xoftware.id/v2';
  })();
  const hostName = window.location.hostname.toLowerCase();
  const canLoadTurnstile =
    hostName === 'xoftware.id' || hostName.endsWith('.xoftware.id');

  let statusElement;
  let turnstileWidgetId = null;
  let turnstilePoll = null;

  const clearTurnstile = () => {
    if (turnstilePoll) {
      window.clearInterval(turnstilePoll);
      turnstilePoll = null;
    }
    if (turnstileWidgetId !== null && window.turnstile) {
      try {
        window.turnstile.remove(turnstileWidgetId);
      } catch {
        // The widget may already have been removed during a view change.
      }
    }
    turnstileWidgetId = null;
    state.token = '';
  };

  const setStatus = (message, kind = 'error') => {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.dataset.kind = kind;
    statusElement.hidden = !message;
  };

  const addTurnstile = (container) => {
    if (!canLoadTurnstile) {
      container.append(
        makeElement(
          'p',
          'xoftware-auth-help',
          'CAPTCHA hanya tersedia di domain resmi Xoftware. Login sungguhan mungkin tidak dapat diproses dari Preview.',
        ),
      );
      return;
    }

    const scriptId = 'xoftware-turnstile-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }

    let attempts = 0;
    turnstilePoll = window.setInterval(() => {
      attempts += 1;
      if (window.turnstile && container.isConnected && turnstileWidgetId === null) {
        window.clearInterval(turnstilePoll);
        turnstilePoll = null;
        try {
          turnstileWidgetId = window.turnstile.render(container, {
            sitekey: '0x4AAAAAACVdTwKK2g0m69oE',
            theme: 'light',
            callback: (token) => {
              state.token = token;
              setStatus('');
            },
            'expired-callback': () => {
              state.token = '';
            },
            'timeout-callback': () => {
              state.token = '';
            },
          });
        } catch {
          setStatus('Verifikasi keamanan tidak dapat dimuat. Anda tetap bisa mencoba masuk.');
        }
      } else if (attempts >= 100) {
        window.clearInterval(turnstilePoll);
        turnstilePoll = null;
        setStatus('Verifikasi keamanan belum tersedia. Anda tetap bisa mencoba masuk.', 'info');
      }
    }, 100);
  };

  const postApi = async (path, body) => {
    try {
      const response = await fetch(`${apiRoot}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.error) {
        return {
          error: true,
          message: result?.message || `Permintaan gagal (HTTP ${response.status}).`,
        };
      }
      return result;
    } catch {
      return {
        error: true,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
      };
    }
  };

  const finishLogin = (token) => {
    if (!token) {
      setStatus('Token login tidak tersedia. Silakan coba lagi.');
      return;
    }
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      `__access__token__=${encodeURIComponent(token)}; Max-Age=2592000; Path=/; SameSite=Lax${secure}`;
    setStatus('Login berhasil. Membuka halaman akun…', 'success');
    window.setTimeout(() => window.location.assign('/owner'), 500);
  };

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const makeField = (form, { label, type = 'text', value = '', autocomplete = '' }) => {
    const wrapper = makeElement('label', 'xoftware-auth-label', label);
    const input = makeElement('input', 'xoftware-auth-input');
    input.type = type;
    input.value = value;
    input.required = true;
    input.autocomplete = autocomplete;
    if (type === 'email') input.inputMode = 'email';
    wrapper.append(input);
    form.append(wrapper);
    return input;
  };

  const makeButton = (text, kind = 'primary', type = 'submit') => {
    const button = makeElement(
      'button',
      kind === 'primary' ? 'xoftware-auth-primary' : 'xoftware-auth-secondary',
      text,
    );
    button.type = type;
    return button;
  };

  const restoreMethodChoices = () => {
    clearTurnstile();
    panel.style.display = 'none';
    panel.replaceChildren();
    choiceStack.style.display = originalChoiceDisplay;
    siblingStacks.forEach(({ stack, display }) => {
      stack.style.display = display;
    });
    state.step = 'choice';
    state.identity = '';
    state.password = '';
    state.tempToken = '';
    state.token = '';
  };

  const goBack = () => {
    if (state.step === 'identity') return restoreMethodChoices();
    if (state.step === 'password') {
      state.step = 'identity';
    } else if (state.step === 'forgot-email') {
      state.step = 'password';
    } else if (state.step === 'forgot-reset') {
      state.step = 'forgot-email';
    } else if (state.step === 'otp' || state.step === 'setup-2fa') {
      state.step = 'password';
    } else if (state.step === 'security-prompt') {
      state.step = 'password';
    }
    render();
  };

  const render = () => {
    clearTurnstile();
    panel.replaceChildren();
    panel.style.display = 'flex';
    choiceStack.style.display = 'none';
    siblingStacks.forEach(({ stack }) => {
      stack.style.display = 'none';
    });

    const back = makeElement('button', 'xoftware-auth-back', '← Kembali');
    back.type = 'button';
    back.addEventListener('click', goBack);
    panel.append(back);

    const titles = {
      identity: `Masukkan ${state.method === 'email' ? 'email' : 'username'}`,
      password: 'Masukkan password',
      otp: 'Kode Google Authenticator',
      'setup-2fa': 'Aktivasi Authenticator',
      'security-prompt': 'Keamanan Akun',
      'forgot-email': 'Lupa password',
      'forgot-reset': 'Verifikasi dan buat password baru',
    };
    panel.append(makeElement('h1', 'xoftware-auth-title', titles[state.step] || 'Login'));

    statusElement = makeElement('p', 'xoftware-auth-message');
    statusElement.hidden = true;
    panel.append(statusElement);

    if (state.step === 'security-prompt') {
      panel.append(
        makeElement(
          'p',
          'xoftware-auth-help',
          'Untuk keamanan akun, Anda dapat mengaktifkan Google Authenticator sekarang atau melanjutkan tanpa mengaktifkannya.',
        ),
      );
      const enable = makeButton('Aktifkan sekarang');
      enable.type = 'button';
      enable.addEventListener('click', async () => {
        enable.disabled = true;
        const result = await postApi('/owner/auth/login', {
          ...(state.method === 'email'
            ? { email: state.identity }
            : { username: state.identity }),
          loginMethod: state.method,
          password: state.password,
          requestAuthenticatorSetup: true,
          token: state.token,
        });
        enable.disabled = false;
        if (result.error) return setStatus(result.message);
        const data = result.data;
        if (!data?.setup2FA || !data?.tempToken) {
          return setStatus('Respons setup Authenticator tidak dikenali.');
        }
        state.tempToken = data.tempToken;
        state.twoFactorSecret = data.secretCode || '';
        state.qrImage = data.qrImage || '';
        state.setupOrigin = 'optional';
        state.step = 'setup-2fa';
        render();
      });
      const skip = makeButton('Lewati untuk sekarang', 'secondary', 'button');
      skip.addEventListener('click', () => finishLogin(state.pendingAuthToken));
      panel.append(enable, skip);
      return;
    }

    if (state.step === 'setup-2fa') {
      if (state.qrImage) {
        const qr = makeElement('img', 'xoftware-auth-qr');
        qr.src = state.qrImage;
        qr.alt = 'QR code Google Authenticator';
        panel.append(qr);
      }
      if (state.twoFactorSecret) {
        panel.append(
          makeElement(
            'div',
            'xoftware-auth-secret',
            `Kode manual: ${state.twoFactorSecret}`,
          ),
        );
      }
    }

    const form = makeElement('form', 'xoftware-auth-form');
    const submit = makeButton(
      state.step === 'password' ? 'Masuk' : state.step === 'setup-2fa' ? 'Aktifkan & Simpan' : 'Lanjut',
    );
    let input;

    if (state.step === 'identity') {
      input = makeField(form, {
        label: state.method === 'email' ? 'Email' : 'Username',
        type: state.method === 'email' ? 'email' : 'text',
        value: state.identity,
        autocomplete: state.method === 'email' ? 'email' : 'username',
      });
    } else if (state.step === 'password') {
      input = makeField(form, {
        label: 'Password',
        type: 'password',
        value: state.password,
        autocomplete: 'current-password',
      });
      const captcha = makeElement('div', 'xoftware-auth-captcha');
      captcha.setAttribute('aria-label', 'Verifikasi keamanan');
      form.append(captcha);
      const forgot = makeButton('Lupa Password?', 'secondary', 'button');
      forgot.className = 'xoftware-auth-link';
      forgot.addEventListener('click', () => {
        state.forgotEmail = state.method === 'email' ? state.identity : '';
        state.step = 'forgot-email';
        render();
      });
      form.append(forgot);
      addTurnstile(captcha);
    } else if (state.step === 'otp') {
      input = makeField(form, {
        label: 'Kode Authenticator (6 digit)',
        type: 'text',
        autocomplete: 'one-time-code',
      });
      input.inputMode = 'numeric';
      input.maxLength = 6;
    } else if (state.step === 'setup-2fa') {
      input = makeField(form, {
        label: 'Kode OTP dari Google Authenticator',
        type: 'text',
        autocomplete: 'one-time-code',
      });
      input.inputMode = 'numeric';
      input.maxLength = 6;
    } else if (state.step === 'forgot-email') {
      input = makeField(form, {
        label: 'Email akun',
        type: 'email',
        value: state.forgotEmail,
        autocomplete: 'email',
      });
      const captcha = makeElement('div', 'xoftware-auth-captcha');
      captcha.setAttribute('aria-label', 'Verifikasi keamanan');
      form.append(captcha);
      addTurnstile(captcha);
    } else if (state.step === 'forgot-reset') {
      input = makeField(form, {
        label: state.requiresTwoFactor ? 'Kode Google Authenticator' : 'Kode OTP email',
        type: 'text',
        value: state.forgotCode,
        autocomplete: 'one-time-code',
      });
      input.inputMode = 'numeric';
      input.maxLength = 6;
      const newPassword = makeField(form, {
        label: 'Password baru',
        type: 'password',
        value: state.newPassword,
        autocomplete: 'new-password',
      });
      const confirmPassword = makeField(form, {
        label: 'Konfirmasi password baru',
        type: 'password',
        value: state.confirmPassword,
        autocomplete: 'new-password',
      });
      newPassword.addEventListener('input', () => {
        state.newPassword = newPassword.value;
      });
      confirmPassword.addEventListener('input', () => {
        state.confirmPassword = confirmPassword.value;
      });
      panel.append(
        makeElement(
          'p',
          'xoftware-auth-help',
          state.requiresTwoFactor
            ? 'Masukkan kode dari Google Authenticator.'
            : 'Kode verifikasi telah diminta untuk email akun Anda.',
        ),
      );
    }

    if (input) {
      form.append(submit);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('');

        if (state.step === 'identity') {
          state.identity = input.value.trim();
          if (!state.identity) return setStatus('Masukkan username atau email.');
          state.step = 'password';
          render();
          return;
        }

        if (state.step === 'password') {
          state.password = input.value;
          if (!state.password) return setStatus('Masukkan password.');
          submit.disabled = true;
          submit.textContent = 'Memeriksa…';
          const result = await postApi('/owner/auth/login', {
            ...(state.method === 'email'
              ? { email: state.identity }
              : { username: state.identity }),
            loginMethod: state.method,
            password: state.password,
            token: state.token,
          });
          submit.disabled = false;
          submit.textContent = 'Masuk';
          if (result.error) return setStatus(result.message);
          const data = result.data;
          if (data?.setup2FA) {
            state.tempToken = data.tempToken;
            state.twoFactorSecret = data.secretCode || '';
            state.qrImage = data.qrImage || '';
            state.setupOrigin = 'forced';
            state.step = 'setup-2fa';
            render();
          } else if (
            data?.tempToken &&
            (data?.authenticatorRequired === true || data?.isTwoFA === true)
          ) {
            state.tempToken = data.tempToken;
            state.step = 'otp';
            render();
          } else if (data?.authToken && data?.suggestAuthenticator) {
            state.pendingAuthToken = data.authToken;
            state.step = 'security-prompt';
            render();
          } else if (data?.authToken) {
            finishLogin(data.authToken);
          } else {
            setStatus('Respons login tidak dikenali. Silakan coba lagi.');
          }
          return;
        }

        if (state.step === 'otp') {
          const code = input.value.trim();
          if (!/^\d{6}$/.test(code)) return setStatus('Masukkan kode 6 digit.');
          submit.disabled = true;
          submit.textContent = 'Memverifikasi…';
          const result = await postApi('/owner/auth/login', {
            tempToken: state.tempToken,
            otpVerification: code,
          });
          submit.disabled = false;
          submit.textContent = 'Lanjut';
          if (result.error) return setStatus(result.message);
          if (!result.data?.authToken) return setStatus('Kode tidak valid atau sesi telah berakhir.');
          finishLogin(result.data.authToken);
          return;
        }

        if (state.step === 'setup-2fa') {
          const code = input.value.trim();
          if (!/^\d{6}$/.test(code)) return setStatus('Masukkan kode 6 digit.');
          submit.disabled = true;
          submit.textContent = 'Menyimpan…';
          const result = await postApi('/owner/auth/login', {
            ...(state.method === 'email'
              ? { email: state.identity }
              : { username: state.identity }),
            loginMethod: state.method,
            password: state.password,
            tempToken: state.tempToken,
            otpVerification: code,
          });
          submit.disabled = false;
          submit.textContent = 'Aktifkan & Simpan';
          if (result.error) return setStatus(result.message);
          if (!result.data?.authToken) return setStatus('Kode tidak valid. Periksa dan coba lagi.');
          finishLogin(result.data.authToken);
          return;
        }

        if (state.step === 'forgot-email') {
          state.forgotEmail = input.value.trim();
          if (!state.forgotEmail) return setStatus('Masukkan email akun.');
          submit.disabled = true;
          submit.textContent = 'Mengirim…';
          const result = await postApi('/owner/auth/forgot-password/request', {
            email: state.forgotEmail,
            token: state.token,
          });
          submit.disabled = false;
          submit.textContent = 'Lanjut';
          if (result.error) return setStatus(result.message);
          state.requiresTwoFactor = Boolean(result.data?.requires2FA);
          state.step = 'forgot-reset';
          render();
          setStatus(
            state.requiresTwoFactor
              ? 'Akun ini memakai 2FA. Masukkan kode Google Authenticator.'
              : 'Permintaan kode verifikasi berhasil dikirim.',
            'info',
          );
          return;
        }

        if (state.step === 'forgot-reset') {
          state.forgotCode = input.value.trim();
          if (!state.forgotCode) return setStatus('Masukkan kode verifikasi.');
          if (!state.newPassword || !state.confirmPassword) {
            return setStatus('Masukkan dan konfirmasi password baru.');
          }
          if (state.newPassword !== state.confirmPassword) {
            return setStatus('Konfirmasi password tidak cocok.');
          }
          submit.disabled = true;
          submit.textContent = 'Memperbarui…';
          const result = await postApi('/owner/auth/forgot-password/action', {
            email: state.forgotEmail,
            otpCode: state.forgotCode,
            newPassword: state.newPassword,
            confirmPassword: state.confirmPassword,
          });
          submit.disabled = false;
          submit.textContent = 'Lanjut';
          if (result.error) return setStatus(result.message);
          state.password = '';
          state.step = 'password';
          render();
          setStatus('Password berhasil diperbarui. Silakan masuk.', 'success');
        }
      });

      if (state.step === 'setup-2fa' && state.setupOrigin === 'forced') {
        const skip = makeButton('Lewati & Matikan 2FA', 'secondary', 'button');
        skip.disabled = false;
        skip.addEventListener('click', async () => {
          skip.disabled = true;
          const result = await postApi('/owner/auth/login', {
            ...(state.method === 'email'
              ? { email: state.identity }
              : { username: state.identity }),
            loginMethod: state.method,
            password: state.password,
            skipAuthenticator: true,
            token: state.token,
          });
          skip.disabled = false;
          if (result.error) return setStatus(result.message);
          if (result.data?.authToken) finishLogin(result.data.authToken);
          else setStatus('Respons login tidak dikenali.');
        });
        form.append(skip);
      }
    }

    panel.append(form);
    input?.focus();
  };

  const startLogin = (method) => {
    clearTurnstile();
    state.method = method;
    state.identity = '';
    state.password = '';
    state.step = 'identity';
    screenHost.append(panel);
    render();
  };

  methodButtons.forEach((button) => {
    const method = button.textContent.trim().toLowerCase().endsWith('email')
      ? 'email'
      : 'username';
    button.addEventListener('click', () => startLogin(method));
  });
})();
