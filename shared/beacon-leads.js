/**
 * Beacon Leads Connector — captura leads dos formulários da landing
 * e envia para o endpoint público do Beacon (POST /public/leads).
 *
 * Como usar:
 *   <script src="../shared/beacon-leads.js" defer></script>
 *   <script>
 *     BeaconLeads.attach({
 *       formId: 'lead-form',                  // id do <form>
 *       successId: 'form-success',            // div mostrada após sucesso (opcional)
 *       origin: 'landing-modelo-1',           // identifica de onde veio
 *       endpoint: 'http://localhost:8000'     // gateway do Beacon (opcional)
 *     });
 *   </script>
 *
 * O script lê os campos do form e mapeia automaticamente:
 *   email          -> email
 *   whatsapp       -> phone
 *   nome           -> name (opcional)
 *   empresa        -> company (opcional)
 *   ramo OR ramo_atividade -> vertical
 *   cargo OR position      -> position
 *   tipo_app[]     -> opportunity (concatenado)
 *   mensagem OR message    -> opportunity (sobrescreve se houver)
 */
(function (global) {
  "use strict";

  const DEFAULT_ENDPOINT =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:8000"
      : "https://api.beacon.lampup.com.br";

  function getValue(form, names) {
    for (const n of names) {
      const el = form.querySelector(`[name="${n}"]`);
      if (el && el.value) return el.value.trim();
    }
    return "";
  }

  function getCheckedValues(form, name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)]
      .map((el) => el.value)
      .filter(Boolean);
  }

  function buildPayload(form, origin) {
    const tipos = getCheckedValues(form, "tipo_app");
    const opportunity =
      getValue(form, ["mensagem", "message", "opportunity"]) ||
      (tipos.length ? "Tipo de aplicação: " + tipos.join(", ") : "");

    return {
      name: getValue(form, ["nome", "name", "primeiro_nome"]) || "Sem nome",
      email: getValue(form, ["email", "e-mail"]),
      whatsapp: getValue(form, ["whatsapp", "telefone", "phone", "celular"]),
      company: getValue(form, ["empresa", "company", "razao_social"]),
      ramo_atividade: getValue(form, ["ramo", "ramo_atividade", "vertical"]),
      position: getValue(form, ["cargo", "position", "role"]),
      location: getValue(form, ["cidade", "location"]),
      tipo_aplicacao: tipos.join(", "),
      opportunity,
      origin: origin || "landing-page",
    };
  }

  async function submit(arg1, arg2) {
    // Aceita submit(payload) ou submit(endpoint, payload)
    const endpoint = arg2 ? arg1 : DEFAULT_ENDPOINT;
    const payload = arg2 ? arg2 : arg1;
    const res = await fetch(endpoint + "/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${txt ? " — " + txt : ""}`);
    }
    return res.json();
  }

  function attach(opts) {
    const form = document.getElementById(opts.formId);
    if (!form) {
      console.warn("[BeaconLeads] form not found:", opts.formId);
      return;
    }
    const success = opts.successId ? document.getElementById(opts.successId) : null;
    const endpoint = opts.endpoint || DEFAULT_ENDPOINT;
    const origin = opts.origin || ("landing-" + location.pathname);

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const lgpdEl = form.querySelector("[name='consent_lgpd'], #consent-lgpd, [name='aceite_lgpd']");
      if (lgpdEl && !lgpdEl.checked) {
        alert("Por favor, aceite a Política de Privacidade.");
        return;
      }

      const btn = form.querySelector("button[type='submit'], input[type='submit']");
      const originalText = btn ? btn.textContent : null;
      if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; }

      const payload = buildPayload(form, origin);
      if (!payload.email || !payload.email.includes("@")) {
        alert("Informe um e-mail válido.");
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
        return;
      }

      try {
        await submit(endpoint, payload);
        if (success) {
          form.style.display = "none";
          success.style.display = "block";
        } else {
          alert("Recebemos seus dados. Em breve entraremos em contato!");
          form.reset();
        }
      } catch (err) {
        console.error("[BeaconLeads]", err);
        alert("Não foi possível enviar agora. Tente novamente em instantes.");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      }
    });
  }

  global.BeaconLeads = { attach, submit, buildPayload };
})(window);
