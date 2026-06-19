# LampUP — Coming Soon

Página única "em breve" servida em `lampup.com.br` enquanto o Modelo 2 está sendo refinado.

## Estrutura

```
coming-soon/
├── index.html                       — página única (HTML/CSS/JS inline)
├── leads.js                         — captura à prova de falha (3 camadas)
├── vercel.json                      — headers de segurança + cache
├── robots.txt
├── sitemap.xml
├── favicon-lampup.png
├── logo-lampup.png
├── politica-de-privacidade.html     — LGPD
├── politica-de-cookies.html         — LGPD
├── termos-de-uso.html
└── fonts/                           — UniNeue (5 pesos)
```

## Deploy local (preview)

```powershell
# Servir estático
npx serve .

# Ou Python
python -m http.server 8080
```

Abrir http://localhost:8080 — a página vai tentar postar em `https://leads.lampup.com.br/submit`, que ainda não existe; sem internet/Worker, o lead vai pra fila no localStorage (camada 2).

## Deploy Vercel

### Pré-requisitos
1. Repo `lampup-it/site-institucional` no GitHub
2. Conta Vercel logada com a mesma conta GitHub
3. Worker `lampup-leads` já no ar (ver `infra/leads-worker/README.md`) — para os leads não ficarem só no localStorage

### Passos
1. Vercel Dashboard → **Add New Project** → importar `lampup-it/site-institucional`
2. **Root Directory:** `coming-soon`
3. **Framework Preset:** Other
4. **Build Command:** vazio
5. **Output Directory:** `.` (ou deixar default)
6. Deploy

### DNS na Cloudflare (após deploy ok)
1. Vercel → Settings → Domains → Add `lampup.com.br` e `www.lampup.com.br`
2. Vercel mostra registros CNAME/A para configurar
3. Cloudflare → DNS → Add Record:
   - `lampup.com.br` → A `76.76.21.21` (ou conforme Vercel)
   - `www.lampup.com.br` → CNAME `cname.vercel-dns.com`
   - Proxy status: **DNS only** (cinza) para validação inicial; ligar proxy laranja depois
4. Vercel valida em ~1 min e emite SSL automático

## Rollback

No dashboard do Vercel → Deployments → escolher um deploy anterior → **"Promote to Production"**.
Volta em <30s, sem perda de DNS/SSL.

## Migração para o Modelo 2 final

Quando o Modelo 2 estiver pronto para produção:
1. Substituir `coming-soon/index.html` pelo HTML do Modelo 2
2. Manter o mesmo `leads.js` (apontando para o Worker)
3. Adicionar JS de cookies (sweep no Modelo 2 para usar `/leads.js` em todos os forms)
4. Deploy = git push, Vercel deploya automático
5. Rollback se algo quebrar = 1 clique
