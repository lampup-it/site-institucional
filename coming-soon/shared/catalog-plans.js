/**
 * Catalog Plans Loader — busca /public/catalog/plans do Beacon e popula
 * a página com os preços vigentes. Falha em silêncio se a API estiver
 * indisponível (o HTML estático permanece como fallback).
 *
 * Como usar:
 *   <script src="../shared/catalog-plans.js" defer></script>
 *
 * O script encontra automaticamente elementos com `data-plan-slug` e
 * atualiza filhos marcados com `data-plan-field`. Slugs reconhecidos:
 *   starter, growth, scale
 *
 * Campos disponíveis:
 *   name, tagline, description_md, is_featured (texto vira "destaque")
 *   monthly_price_brl, annual_price_brl, setup_fee_brl
 *   overage_per_run_brl, runs_quota, cycle_length_months
 *
 * Exemplo:
 *   <article data-plan-slug="starter">
 *     <h3 data-plan-field="name">Starter</h3>
 *     <p data-plan-field="tagline">...</p>
 *     <span data-plan-field="monthly_price_brl">R$ 297</span>
 *     <span data-plan-field="runs_quota">50</span>
 *   </article>
 *
 * Formatação:
 *   - campos *_brl são formatados como BRL via Intl.NumberFormat
 *   - runs_quota é formatado com separador de milhar
 *   - demais campos vão como texto puro
 *
 * Atributo opcional `data-plan-format="raw|currency|integer"` força o formato.
 */
(function (global) {
  "use strict";

  const DEFAULT_ENDPOINT =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:8000"
      : "https://api.lampup.com.br";

  const CURRENCY = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const INTEGER = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

  function formatField(field, value, explicitFormat) {
    if (value === null || value === undefined) return "";
    const fmt = explicitFormat
      || (/_brl$/.test(field) ? "currency"
        : field === "runs_quota" || field === "cycle_length_months" ? "integer"
        : "raw");
    if (fmt === "currency") {
      const n = Number(value);
      return Number.isFinite(n) ? CURRENCY.format(n) : String(value);
    }
    if (fmt === "integer") {
      const n = Number(value);
      return Number.isFinite(n) ? INTEGER.format(n) : String(value);
    }
    return String(value);
  }

  function applyPlan(root, plan) {
    const fields = root.querySelectorAll("[data-plan-field]");
    fields.forEach((el) => {
      const field = el.getAttribute("data-plan-field");
      if (!(field in plan)) return;
      const value = plan[field];
      const explicit = el.getAttribute("data-plan-format") || "";
      el.textContent = formatField(field, value, explicit);
    });
    if (plan.is_featured) {
      root.setAttribute("data-plan-featured", "true");
    }
  }

  async function load(endpoint) {
    const url = `${endpoint || DEFAULT_ENDPOINT}/public/catalog/plans`;
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const plans = await r.json();
      if (!Array.isArray(plans) || plans.length === 0) return;
      const bySlug = {};
      plans.forEach((p) => { if (p && p.slug) bySlug[p.slug] = p; });
      document.querySelectorAll("[data-plan-slug]").forEach((root) => {
        const slug = root.getAttribute("data-plan-slug");
        const plan = bySlug[slug];
        if (plan) applyPlan(root, plan);
      });
    } catch (err) {
      // Falha silenciosa: HTML estático já é o fallback.
      if (global.console && console.warn) {
        console.warn("[catalog-plans] fallback estático em uso:", err.message);
      }
    }
  }

  const api = {
    load,
    setEndpoint(endpoint) { api._endpoint = endpoint; },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => load(api._endpoint));
  } else {
    load(api._endpoint);
  }

  global.CatalogPlans = api;
})(window);
