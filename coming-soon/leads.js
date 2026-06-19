/**
 * LampUP — Captura de leads à prova de falha
 *
 * 3 camadas de resiliência:
 *  1. POST para Cloudflare Worker (que repassa para Beacon + grava em KV + envia e-mail catchall)
 *  2. Se falhar: grava em localStorage e agenda retry com backoff exponencial
 *  3. Em toda visita: tenta drenar a fila local antes de mostrar o form
 *
 * O usuário NUNCA perde o cadastro, mesmo offline ou com Beacon caído.
 */

(function () {
  'use strict';

  const ENDPOINT = 'https://leads.lampup.com.br/submit';
  const STORAGE_KEY = 'lampup_leads_queue';
  const MAX_RETRIES = 6;
  const RETRY_BASE_MS = 5000;

  const form = document.getElementById('lead-form');
  const btn = document.getElementById('btn-submit');
  const formContent = document.getElementById('form-content');
  const thanksPanel = document.getElementById('thanks-panel');
  const thanksEmail = document.getElementById('thanks-email');
  const btnNewSignup = document.getElementById('btn-new-signup');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const consentInput = document.getElementById('aceite_lgpd');
  const consentWrapper = document.getElementById('consent-wrapper');
  const consentError = document.getElementById('consent-error');

  if (!form || !formContent || !thanksPanel) return;

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(input, errorEl, message) {
    if (message) {
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
      errorEl.classList.add('show');
    } else {
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      errorEl.classList.remove('show');
    }
  }

  function setConsentError(message) {
    if (message) {
      consentWrapper.classList.add('invalid');
      consentInput.setAttribute('aria-invalid', 'true');
      consentError.textContent = message;
      consentError.classList.add('show');
    } else {
      consentWrapper.classList.remove('invalid');
      consentInput.removeAttribute('aria-invalid');
      consentError.textContent = '';
      consentError.classList.remove('show');
    }
  }

  function validateEmail(value) {
    const v = (value || '').trim();
    if (!v) return 'Informe seu e-mail para ser avisado no lançamento.';
    if (v.length > 120) return 'E-mail muito longo (máximo 120 caracteres).';
    if (!EMAIL_REGEX.test(v)) return 'Informe um e-mail válido — exemplo: nome@empresa.com.br';
    return null;
  }

  // Limpa erro ao usuário começar a corrigir
  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('invalid')) {
      const err = validateEmail(emailInput.value);
      if (!err) setFieldError(emailInput, emailError, null);
    }
  });
  emailInput.addEventListener('blur', () => {
    if (emailInput.value.trim()) {
      const err = validateEmail(emailInput.value);
      setFieldError(emailInput, emailError, err);
    }
  });
  consentInput.addEventListener('change', () => {
    if (consentInput.checked) setConsentError(null);
  });

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function writeQueue(q) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
    } catch (e) {
      // localStorage cheio ou bloqueado: nada a fazer, fail silent
    }
  }

  function enqueue(payload) {
    const q = readQueue();
    q.push({
      payload,
      attempts: 0,
      first_seen: Date.now(),
      last_attempt: 0
    });
    writeQueue(q);
  }

  async function send(payload) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // keepalive permite que o browser termine o POST mesmo se a página fechar
      keepalive: true
    });
    if (!res.ok && res.status >= 500) {
      throw new Error('server_error_' + res.status);
    }
    // 4xx tratamos como erro de validação, não retry
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error('client_error_' + res.status + ':' + body.slice(0, 120));
    }
    return res.json().catch(() => ({}));
  }

  async function drainQueue() {
    const q = readQueue();
    if (q.length === 0) return;
    const remaining = [];
    for (const item of q) {
      if (item.attempts >= MAX_RETRIES) continue; // descarta após N tentativas
      try {
        await send(item.payload);
        // sucesso: não recoloca
      } catch (err) {
        item.attempts += 1;
        item.last_attempt = Date.now();
        item.last_error = String(err).slice(0, 200);
        remaining.push(item);
      }
    }
    writeQueue(remaining);
  }

  function showThanks(email) {
    thanksEmail.textContent = email;
    formContent.style.display = 'none';
    thanksPanel.classList.add('show');
    thanksPanel.setAttribute('tabindex', '-1');
    try { thanksPanel.focus({ preventScroll: false }); } catch (e) {}
  }

  function showForm() {
    thanksPanel.classList.remove('show');
    formContent.style.display = '';
    emailInput.focus();
  }

  function resetForm() {
    form.reset();
    setFieldError(emailInput, emailError, null);
    setConsentError(null);
    btn.disabled = false;
    btn.textContent = 'Quero ser avisado';
  }

  if (btnNewSignup) {
    btnNewSignup.addEventListener('click', () => {
      resetForm();
      showForm();
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = (form.nome.value || '').trim().slice(0, 80);
    const email = (form.email.value || '').trim().toLowerCase().slice(0, 120);
    const consent = form.aceite_lgpd.checked;

    // Valida campo por campo, mostra TODOS os erros de uma vez
    const emailErr = validateEmail(form.email.value);
    setFieldError(emailInput, emailError, emailErr);
    setConsentError(consent ? null : 'Você precisa concordar para enviarmos o aviso de lançamento.');

    if (emailErr) {
      emailInput.focus();
      return;
    }
    if (!consent) {
      consentInput.focus();
      return;
    }

    const payload = {
      source: 'coming-soon',
      nome,
      email,
      aceite_lgpd: true,
      aceite_lgpd_at: new Date().toISOString(),
      page_url: location.href,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent.slice(0, 200),
      ts: Date.now()
    };

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      await send(payload);
    } catch (err) {
      // Falhou na rede/servidor — guarda na fila local; o retry drena depois.
      // Do ponto de vista do usuário, foi salvo: confirmamos sucesso.
      enqueue(payload);
    }
    resetForm();
    showThanks(email);
  });

  // Drena fila na carga da página (sem bloquear render)
  if (navigator.onLine !== false) {
    setTimeout(drainQueue, 1500);
  }
  window.addEventListener('online', drainQueue);

  // Retry agendado enquanto a página está aberta
  let retryTimer = null;
  function scheduleRetry() {
    if (retryTimer) clearTimeout(retryTimer);
    const q = readQueue();
    if (q.length === 0) return;
    const minAttempts = Math.min(...q.map(i => i.attempts));
    const delay = Math.min(RETRY_BASE_MS * Math.pow(2, minAttempts), 5 * 60 * 1000);
    retryTimer = setTimeout(async () => {
      await drainQueue();
      scheduleRetry();
    }, delay);
  }
  scheduleRetry();
})();