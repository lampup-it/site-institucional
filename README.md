# LampUP IT — Site Institucional

Site público da LampUP IT em `lampup.com.br`.

> Lighting up your business.

## Status

| Versão | Conteúdo | Status |
|---|---|---|
| v0.1 | Coming soon page (captura de leads) | Substituída em 07/09/2026 |
| **v0.2** | Página oficial: Lumen no ar, cadastro fechado (lead "avise-me"), seção A empresa (CNPJ/endereço/contato) | Em produção |
| v0.3 | `index-launch.html` — versão com "Começar grátis", publicar só quando o cadastro abrir (`SIGNUP_OPEN=true` no Lumen) | Pronta, aguardando abertura do cadastro |
| v1.0 | Modelo 2 — Clean Tech (landing completa) | Em refinamento |

## Estrutura

```
site-institucional/
├── coming-soon/                 ← Versão atual em produção (raiz do Vercel)
│   ├── index.html               — Página oficial (07/09): Lumen no ar + lead "avise-me" + A empresa
│   ├── index-launch.html        — Versão do dia D com "Começar grátis" (cadastro aberto)
│   ├── maria-clara-*.png/.webp  — Mascote (recortes das artes finais em MARIA CLARA E CLARINHA/revisadas/)
│   ├── leads.js                 — Captura à prova de falha (3 camadas)
│   ├── vercel.json              — Headers de segurança + cache
│   ├── robots.txt, sitemap.xml
│   ├── favicon-lampup.png
│   ├── logo-lampup.png, logo-lampup-fundo-azul.png, simbolo-lampup.png
│   ├── planos.html              — Redireciona para lumen.lampup.com.br/planos
│   ├── politica-de-privacidade.html
│   ├── politica-de-cookies.html
│   ├── termos-de-uso.html
│   ├── shared/                  — Cópia local dos conectores compartilhados
│   └── fonts/                   — UniNeue (5 pesos)
│
├── modelo-1/ ... modelo-7/      ← Variações em refinamento (não publicadas)
├── planos.html                  ← ESPELHO EXATO do arquivo em coming-soon/
├── politica-de-privacidade.html ← ESPELHO EXATO do arquivo em coming-soon/
├── politica-de-cookies.html     ← ESPELHO EXATO
├── termos-de-uso.html           ← ESPELHO EXATO
└── shared/                      ← Conectores dos modelos: beacon-leads.js (leads → Beacon),
                                   catalog-plans.js (planos dinâmicos do catalog-svc),
                                   lgpd-cookies.js (banner de consentimento)
```

### ⚠ Os arquivos da raiz são ESPELHOS, não versões de trabalho

`coming-soon/` é a raiz publicada. Os arquivos homônimos na raiz do repo
existem para os `modelo-*/` consumirem, mas **têm de ser cópia byte a byte**
dos publicados — inclusive `shared/`.

Isso não é preciosismo: até 01/09/2026 as duas cópias tinham divergido em
silêncio, e a da raiz era a errada. O `termos-de-uso.html` da raiz declarava
*"CNPJ: a ser registrado"* e trazia um aviso de "rascunho aguardando validação
jurídica" que a versão publicada já não tinha; a política de privacidade
repetia o CNPJ ausente. Página jurídica pública dizendo que a empresa não está
registrada é problema real, e ninguém percebe porque a errada não é a que
está no ar — até alguém publicar a cópia errada.

**Ao editar qualquer um destes arquivos, edite em `coming-soon/` e copie para
a raiz na mesma passada.**

### Planos: a página não guarda mais preço

`planos.html` era uma vitrine estática com Starter / Growth / Scale
(R$ 297 / 897 / 2.497, cobrados por "execuções/mês"). Esses planos entraram
em **sunset no B-110 (02/08/2026)** e o modelo passou a ser por token —
mas, como o `catalog-plans.js` casa por *slug* e slug em sunset não retorna
no endpoint público, a substituição dinâmica nunca acontecia: a página exibiu
preços de julho, em produção, por um mês.

Desde 01/09 ela **redireciona** para `lumen.lampup.com.br/planos`, que lê o
catálogo vigente. Fonte da verdade única = `catalog-svc`. Não reintroduzir
tabela de preços no site institucional.

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
