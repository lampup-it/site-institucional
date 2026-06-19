/**
 * LampUP IT — LGPD Cookie Consent Manager
 * Gerencia consentimento de cookies conforme Lei 13.709/2018 (LGPD)
 */
(function () {
  'use strict';

  const CONSENT_KEY = 'lampup_cookie_consent';
  const CONSENT_VERSION = '1.0';

  const Consent = {
    get() {
      try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.version !== CONSENT_VERSION) return null;
        return data;
      } catch { return null; }
    },

    save(essential, analytics, marketing) {
      const data = {
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
        essential: true,
        analytics: !!analytics,
        marketing: !!marketing,
      };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
      this.applyConsent(data);
      return data;
    },

    revoke() {
      localStorage.removeItem(CONSENT_KEY);
      location.reload();
    },

    applyConsent(data) {
      if (data.analytics) {
        document.dispatchEvent(new CustomEvent('lampup:analytics-consent'));
      }
      if (data.marketing) {
        document.dispatchEvent(new CustomEvent('lampup:marketing-consent'));
      }
    },

    hasConsented() {
      return this.get() !== null;
    }
  };

  function injectBannerStyles() {
    if (document.getElementById('lampup-cookie-styles')) return;
    const style = document.createElement('style');
    style.id = 'lampup-cookie-styles';
    style.textContent = `
      #lampup-cookie-banner {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
        background: #1A1A2E; color: #fff;
        padding: 20px 24px;
        box-shadow: 0 -4px 30px rgba(0,0,0,0.4);
        font-family: 'UniNeue', 'Segoe UI', Arial, sans-serif;
        font-size: 14px; line-height: 1.6;
        animation: slideUpBanner 0.4s ease-out;
      }
      @keyframes slideUpBanner {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #lampup-cookie-banner .banner-inner {
        max-width: 1200px; margin: 0 auto;
        display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;
      }
      #lampup-cookie-banner .banner-text { flex: 1; min-width: 280px; }
      #lampup-cookie-banner .banner-text h4 {
        font-size: 16px; font-weight: 700; color: #00D4E8; margin-bottom: 6px;
      }
      #lampup-cookie-banner .banner-text p { color: rgba(255,255,255,0.8); margin: 0; font-size: 13px; }
      #lampup-cookie-banner .banner-text a { color: #00D4E8; text-decoration: underline; }
      #lampup-cookie-banner .banner-controls { display: flex; flex-direction: column; gap: 10px; min-width: 200px; }
      #lampup-cookie-banner .cookie-options { display: flex; flex-direction: column; gap: 6px; }
      #lampup-cookie-banner .cookie-opt { display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; }
      #lampup-cookie-banner .cookie-opt input[type="checkbox"] { accent-color: #00D4E8; width: 16px; height: 16px; }
      #lampup-cookie-banner .cookie-opt .required-tag { background: rgba(0,212,232,0.2); color: #00D4E8; font-size: 10px; padding: 1px 6px; border-radius: 8px; }
      #lampup-cookie-banner .banner-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
      #lampup-cookie-banner .btn-accept-all {
        background: #5B2D9F; color: #fff; border: none; padding: 10px 20px;
        border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
        transition: background 0.2s;
      }
      #lampup-cookie-banner .btn-accept-all:hover { background: #00D4E8; color: #1A1A2E; }
      #lampup-cookie-banner .btn-accept-selected {
        background: transparent; color: rgba(255,255,255,0.7);
        border: 1px solid rgba(255,255,255,0.3); padding: 10px 16px;
        border-radius: 8px; cursor: pointer; font-size: 12px; transition: all 0.2s;
      }
      #lampup-cookie-banner .btn-accept-selected:hover { color: #fff; border-color: #fff; }
      #lampup-cookie-revoke {
        position: fixed; bottom: 16px; left: 16px; z-index: 9998;
        background: #3D1F6B; color: rgba(255,255,255,0.7); border: none;
        padding: 8px 14px; border-radius: 20px; font-size: 11px; cursor: pointer;
        transition: all 0.2s; display: none;
      }
      #lampup-cookie-revoke:hover { background: #5B2D9F; color: #fff; }
      @media (max-width: 640px) {
        #lampup-cookie-banner .banner-inner { flex-direction: column; }
        #lampup-cookie-banner { padding: 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  function showBanner() {
    injectBannerStyles();
    const privacyPath = findPrivacyPolicyPath();
    const cookiesPath = findCookiesPolicyPath();
    const banner = document.createElement('div');
    banner.id = 'lampup-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Preferências de cookies');
    banner.innerHTML = `
      <div class="banner-inner">
        <div class="banner-text">
          <h4>Sobre cookies neste site</h4>
          <p>
            Utilizamos cookies para melhorar sua experiência. Os essenciais são obrigatórios para o funcionamento do site.
            Os demais só serão ativados com seu consentimento, conforme a
            <strong><a href="${privacyPath}" target="_blank">Política de Privacidade</a></strong>,
            a <strong><a href="${cookiesPath}" target="_blank">Política de Cookies</a></strong>
            e a LGPD (Lei 13.709/2018).
          </p>
        </div>
        <div class="banner-controls">
          <div class="cookie-options">
            <label class="cookie-opt">
              <input type="checkbox" id="lampup-ck-essential" checked disabled>
              <span>Essenciais <span class="required-tag">Obrigatório</span></span>
            </label>
            <label class="cookie-opt">
              <input type="checkbox" id="lampup-ck-analytics">
              <span>Analíticos (desempenho)</span>
            </label>
            <label class="cookie-opt">
              <input type="checkbox" id="lampup-ck-marketing">
              <span>Marketing (remarketing)</span>
            </label>
          </div>
          <div class="banner-actions">
            <button class="btn-accept-all" id="lampup-accept-all">Aceitar todos</button>
            <button class="btn-accept-selected" id="lampup-accept-selected">Salvar preferências</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('lampup-accept-all').addEventListener('click', function () {
      Consent.save(true, true, true);
      hideBanner();
      showRevokeButton();
    });

    document.getElementById('lampup-accept-selected').addEventListener('click', function () {
      const analytics = document.getElementById('lampup-ck-analytics').checked;
      const marketing = document.getElementById('lampup-ck-marketing').checked;
      Consent.save(true, analytics, marketing);
      hideBanner();
      showRevokeButton();
    });
  }

  function hideBanner() {
    const banner = document.getElementById('lampup-cookie-banner');
    if (banner) {
      banner.style.animation = 'none';
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity = '0';
      banner.style.transition = 'all 0.3s';
      setTimeout(() => banner.remove(), 300);
    }
  }

  function showRevokeButton() {
    let btn = document.getElementById('lampup-cookie-revoke');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'lampup-cookie-revoke';
      btn.textContent = 'Gerenciar cookies';
      btn.addEventListener('click', function () {
        Consent.revoke();
      });
      document.body.appendChild(btn);
    }
    btn.style.display = 'block';
  }

  function findPrivacyPolicyPath() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/modelo-')) return '../politica-de-privacidade.html';
    return 'politica-de-privacidade.html';
  }

  function findCookiesPolicyPath() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/modelo-')) return '../politica-de-cookies.html';
    return 'politica-de-cookies.html';
  }

  function init() {
    if (Consent.hasConsented()) {
      const data = Consent.get();
      Consent.applyConsent(data);
      showRevokeButton();
    } else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
      } else {
        setTimeout(showBanner, 800);
      }
    }
  }

  window.LampUPConsent = Consent;
  init();
})();
