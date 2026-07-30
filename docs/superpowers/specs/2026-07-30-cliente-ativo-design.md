# Empresa ativa/inativa — design

**Data:** 2026-07-30
**Projeto:** jc-contabilidade

## Problema

A emissão de recibos em lote (`POST /api/recibos/lote`) gera recibo para toda empresa que tenha `honorarioPadrao` preenchido. Não existe forma de tirar uma empresa do lote sem apagar o cadastro ou zerar o honorário — as duas opções perdem dados.

## Solução

Adicionar uma flag `ativo` no cadastro de cliente, marcada por padrão. Empresas inativas continuam no sistema com todo o histórico, mas são excluídas da emissão em lote.

## Modelo de dados

`prisma/schema.prisma`, model `Cliente`:

```prisma
ativo Boolean @default(true)
```

O projeto não usa migrations (`prisma/migrations` não existe; `npm start` roda `prisma db push`). A mudança é aplicada com `npm run db:push`. Empresas já cadastradas recebem `ativo = true` pelo default da coluna — não há backfill manual.

`src/types/index.ts`:
- `Cliente` ganha `ativo: boolean`
- `CreateClienteDTO` e `UpdateClienteDTO` ganham `ativo?: boolean`

## API

### `POST /api/clientes`
Aceita `ativo` no body. Quando ausente, cria com `true`.

### `PUT /api/clientes/[id]`
Aceita `ativo` no body. Segue o padrão já usado no arquivo, que monta `updateData` campo a campo — `if (ativo !== undefined) updateData.ativo = ativo;`. Assim um PUT parcial `{ ativo: false }` não zera os outros campos. É o mesmo endpoint usado pelo toggle rápido da lista.

### `GET /api/clientes`
Novo query param `status`, com três valores:

| valor | comportamento |
|---|---|
| `todos` (default, e qualquer valor inválido) | sem filtro por `ativo` |
| `ativos` | `ativo: true` |
| `inativos` | `ativo: false` |

O filtro é combinado com o `search` existente no mesmo objeto `where` (`AND` implícito do Prisma), e vale tanto no caminho de ordenação nativa quanto no de ordenação por agregado.

### `POST /api/recibos/lote`
O `where` da busca de clientes passa a ser:

```ts
{ honorarioPadrao: { not: null }, ativo: true }
```

A mensagem de erro do caso vazio muda para `"Nenhum cliente ativo possui honorário padrão cadastrado"`. O contador `skipped` continua contando apenas clientes que já tinham recibo no mês — empresas inativas não entram na contagem porque nunca chegam à lista.

Recibos já emitidos para uma empresa que depois foi desativada não são afetados: seguem visíveis, editáveis e contabilizados nos relatórios.

## UI

### ClienteWizard (`src/components/clientes/ClienteWizard.tsx`)
- Checkbox **"Empresa ativa"** no passo 2 (Contato e Valores), abaixo do honorário padrão.
- Marcado por padrão em cadastro novo; no modo edição carrega o valor atual do cliente.
- Legenda: *"Empresas inativas não entram na emissão de recibos em lote."*
- No passo 3 (Revisão), aparece como badge na seção "Contato e Valores": verde "Ativa" ou cinza "Inativa".
- O estado é resetado junto com os outros campos no `useEffect` de abertura do modal.
- `ativo` vai no body do POST/PUT do `handleSubmit`.

### Lista de Clientes (`src/app/(dashboard)/clientes/page.tsx`)
- Badge Ativa/Inativa na linha da tabela, ao lado do nome.
- Select de filtro **Todas / Ativas / Inativas** na barra de busca, ao lado do select de ordenação. Default: Todas. Trocar o filtro volta para a página 1 e refaz o fetch, igual ao select de ordenação.
- Botão de ação rápida por linha (ícone `toggle_on` quando ativa, `toggle_off` quando inativa) que dispara `PUT /api/clientes/[id]` com `{ ativo: !ativo }` e recarrega a lista. Sem modal de confirmação — a ação é reversível em um clique.

### ReciboWizard (`src/components/recibos/ReciboWizard.tsx`)
Clientes inativos continuam selecionáveis para recibo individual, para não bloquear uma emissão pontual:
- No `SearchableSelect`, o label da opção recebe o sufixo `" — Inativa"`. O componente só aceita label em texto, por isso sufixo em vez de badge.
- No card do cliente selecionado (abaixo do select), um badge cinza "Inativa" ao lado do nome.

## Fora de escopo

- Data de desativação, motivo, ou histórico de mudanças de status.
- Desativação em massa.
- Esconder empresas inativas dos relatórios ou do dashboard.
- Bloquear a emissão individual para empresa inativa.

## Verificação

O projeto não tem suíte de testes nem script `test` no `package.json`. A verificação é:

1. `npx tsc --noEmit` — sem erros de tipo.
2. `npm run lint` — sem erros.
3. Smoke manual:
   - Cadastrar uma empresa nova → nasce Ativa.
   - Desativar pelo toggle da lista → badge muda, filtro "Ativas" deixa de mostrá-la, filtro "Inativas" mostra.
   - Abrir a empresa no wizard → checkbox vem desmarcado; remarcar e salvar volta para Ativa.
   - Desativar uma empresa **com honorário padrão** e rodar emissão em lote de um mês novo → o recibo dela não é criado; as ativas com honorário são criadas normalmente.
   - Abrir o ReciboWizard → a empresa inativa aparece no select com o sufixo "— Inativa".
