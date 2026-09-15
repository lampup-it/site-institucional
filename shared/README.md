# Landing → Beacon Integration

> ⚠ **NENHUMA página deste repositório carrega estes arquivos hoje** (15/09/2026).
> Os consumidores eram os layouts `modelo-1/` a `modelo-7/`, removidos em 15/09
> (commit `80bcbe1`), e o `planos.html`, que virou redirect em 01/09. O site no
> ar é o `coming-soon/`, que usa o próprio `coming-soon/leads.js` — outro fluxo,
> via Worker.
>
> Ficam aqui como **referência para a próxima landing**, não como código vivo.
> Antes de reusar qualquer um, conferir contra o que o Beacon aceita hoje: este
> documento descreve o estado de quando os modelos existiam.

Este diretório contém os 3 conectores que os modelos da landing compartilhavam:

| Arquivo | Função |
|---|---|
| `beacon-leads.js` | Envia leads do formulário para o Beacon (`/public/leads`) — documentado abaixo |
| `catalog-plans.js` | Renderiza planos dinâmicos consumindo `GET /public/catalog/plans` do catalog-svc, com fallback estático |
| `lgpd-cookies.js` | Banner de consentimento de cookies (LGPD) — bloqueia tracking antes do aceite |

> Nota: os modelos postavam direto no Beacon via `beacon-leads.js` (endpoints abaixo). A página **coming-soon**, que é o site em produção, usa outro fluxo — POST no Worker `leads.lampup.com.br/submit` (3 camadas, ver `infra/leads-worker/`), e o Worker **está no ar**.

## Como conectar os formulários da landing ao funil de leads do Beacon

## 1. Inclua o script `beacon-leads.js`

Em cada `modelo-X/index.html`, antes do `</body>`:

```html
<script src="../shared/beacon-leads.js" defer></script>
```

## 2. Conecte o formulário

Onde o seu `<form id="lead-form">` tinha lógica própria (ou um TODO de Formspree),
substitua por:

```html
<script>
  BeaconLeads.attach({
    formId: 'lead-form',         // id do <form>
    successId: 'form-success',   // id do bloco que aparece após sucesso (opcional)
    origin: 'landing-institucional',  // marca de onde veio
  });
</script>
```

## 3. Mapeamento automático de campos

O script já sabe ler:

| Campo do form              | Vai para o Beacon       |
|----------------------------|--------------------------|
| `name="email"`             | `email`                  |
| `name="nome"` / `name`     | `name`                   |
| `name="empresa"`           | `company`                |
| `name="whatsapp"` / `telefone` | `phone`              |
| `name="ramo"` / `ramo_atividade` | `vertical`         |
| `name="cargo"` / `position`| `position`               |
| `name="cidade"` / `location`| `location`              |
| `name="mensagem"` / `message` | `opportunity`         |
| `name="tipo_app"` (checkboxes) | concatena em `opportunity` |

## 4. Endpoint

Por padrão:

- Em `localhost` → `http://localhost:8000/public/leads`
- Em produção → `https://api.beacon.lampup.com.br/public/leads`

Você pode sobrescrever com `endpoint`:

```js
BeaconLeads.attach({
  formId: 'lead-form',
  endpoint: 'https://api.beacon.lampup.com.br',
});
```

## 5. Confirmação de funcionamento

Após o usuário submeter:

1. Aparece a div `successId` (ou um `alert`)
2. No Beacon, vá em `CRM & Funil de Vendas` → coluna **Novos**
3. O lead aparece com:
   - `source = "Site"`
   - `stage = "new"`
   - `notes` contém a origem (`origin`)
   - Os scores BANT começam zerados → qualificação **"Frio"**

A partir daí o time comercial qualifica, evolui de estágio e pontua o BANT.

## Exemplo completo

A referência integrada era `modelo-1/index.html`, removido em 15/09. Para
recuperar o exemplo: `git log --diff-filter=D -- modelo-1` acha o commit e
`git checkout <sha>^ -- modelo-1/index.html` traz o arquivo de volta.

## LGPD

O script respeita o checkbox `consent_lgpd` (ou `aceite_lgpd`, ou `#consent-lgpd`).
Se ele existir e não estiver marcado, o submit é bloqueado.

## Erros comuns

| Sintoma                          | Causa / Fix                                            |
|----------------------------------|--------------------------------------------------------|
| CORS blocked                     | Beacon precisa estar rodando; em prod, garantir que `https://lampup.com.br` está na `allow_origins` do gateway |
| Lead aparece com `name = "Sem nome"` | O form não tem campo `name="nome"`. Adicione ou peça por outro nome |
| Botão fica preso em "Enviando…"  | Veja Network/DevTools — provavelmente erro 4xx/5xx do gateway |
