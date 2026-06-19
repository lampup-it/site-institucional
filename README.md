# LampUP IT — Site Institucional

Site público da LampUP IT em `lampup.com.br`.

> Lighting up your business.

## Status

| Versão | Conteúdo | Status |
|---|---|---|
| **v0.1** | Coming soon page (captura de leads) | Em produção |
| v1.0 | Modelo 2 — Clean Tech (landing completa) | Em refinamento |

## Estrutura

```
site-institucional/
├── coming-soon/                 ← Versão atual em produção (raiz do Vercel)
│   ├── index.html               — Coming soon com captura de e-mail
│   ├── leads.js                 — Captura à prova de falha (3 camadas)
│   ├── vercel.json              — Headers de segurança + cache
│   ├── robots.txt, sitemap.xml
│   ├── favicon-lampup.png
│   ├── logo-lampup.png, logo-lampup-fundo-azul.png, simbolo-lampup.png
│   ├── politica-de-privacidade.html
│   ├── politica-de-cookies.html
│   ├── termos-de-uso.html
│   └── fonts/                   — UniNeue (5 pesos)
│
├── modelo-1/ ... modelo-7/      ← Variações em refinamento (não publicadas)
├── politica-de-privacidade.html ← Versão de referência (modelos vão consumir)
├── politica-de-cookies.html
├── termos-de-uso.html
└── shared/                      ← Conector beacon-leads.js para os modelos
```

## Deploy

### Coming soon (produção atual)
- **Hospedagem:** Vercel
- **Root Directory:** `coming-soon`
- **Build:** sem build (HTML/CSS/JS estático)
- **Domínio:** `lampup.com.br` + `www.lampup.com.br` via Cloudflare DNS
- **Rollback:** Vercel Dashboard → Deployments → Promote previous

### Captura de leads
Os leads coletados vão para um **Cloudflare Worker** (`leads.lampup.com.br`) que:
1. Grava em KV (1 ano de retenção)
2. Repassa para o Beacon (`/public/leads`) quando online
3. Dispara e-mail catchall para `leads@lampup.com.br` via Resend

Código do Worker em `lampup-it/infra` (repo separado).

## Desenvolvimento local

```powershell
cd coming-soon
npx serve .
# ou
python -m http.server 8080
```

Abrir http://localhost:8080. O form vai falhar o POST para `leads.lampup.com.br/submit` (Worker não disponível em dev), mas grava em `localStorage` graças à camada 2 do `leads.js`.

## Identidade visual

- **Cores:** `#00D4E8` (cyan), `#5B2D9F` (roxo), `#3D1F6B` (roxo escuro)
- **Tipografia:** UniNeue (Black/Bold/Book/Light/Heavy)
- **Logo:**
  - Fundo claro: `logo-lampup.png`
  - Fundo escuro: `logo-lampup-fundo-azul.png`
  - Símbolo isolado: `simbolo-lampup.png`

Mais em [memory: visual-identity-lampup] do workspace.

## Compliance

- **LGPD:** banner de consentimento de cookies, Política de Privacidade publicada, base legal documentada
- **WCAG 2.1 AA:** alvo de acessibilidade
- **CNPJ:** 44.339.749/0001-33 — LampUP IT, Alphaville/Barueri-SP

## Licença

Código proprietário — © LampUP IT. Todos os direitos reservados.
