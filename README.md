# API de vendas

API em Node.js, TypeScript, Express e Prisma para receber webhooks de vendas com idempotencia e consultar relatorios.

## Requisitos

- Node.js 22 ou superior
- PostgreSQL 14 ou superior
- npm

## Configuracao e execucao

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e configure `DATABASE_URL`, `X_SEGREDO_WEBHOOK` e, se necessario, `PORTA`.

3. Crie o banco PostgreSQL indicado em `DATABASE_URL` e aplique a migracao inicial:

   ```bash
   npx prisma db push
   ```

4. Inicie a API em modo de desenvolvimento:

   ```bash
   npm run desenvolvimento
   ```

5. Para compilar e iniciar em producao:

   ```bash
   npm run compilar
   npm run iniciar
   ```

Para iniciar pelo Docker, compile a imagem com `docker build -t api-vendas .` e execute-a informando `DATABASE_URL` e `X_SEGREDO_WEBHOOK` no ambiente do container.

## Endpoints

### Receber venda

`POST /webhooks/vendas`

Envie o segredo configurado no `.env` pelo header `x-segredo-webhook`. `dataCriacao` e opcional; se ausente, o banco registra a data atual.

```bash
curl -i http://localhost:3000/webhooks/vendas \
  -H "Content-Type: application/json" \
  -H "x-segredo-webhook: troque-por-um-segredo-forte" \
  -d '{
    "idTransacao": "transacao-1001",
    "status": "APROVADO",
    "valor": 149.90,
    "emailCliente": "cliente@exemplo.com",
    "dataCriacao": "2026-10-25T12:00:00.000Z"
  }'
```

Uma nova venda retorna `201`. Uma transacao previamente recebida retorna `200` sem salvar novamente. Segredo incorreto retorna `401`; payload invalido retorna `400`.

### Consultar relatorio

`GET /relatorios/vendas`

```bash
curl -i http://localhost:3000/relatorios/vendas
```

A resposta inclui a quantidade total de vendas, receita e ticket medio considerando apenas vendas `APROVADO`, e as dez vendas mais recentes de qualquer status. Valores monetarios sao retornados como numeros.

## Estrutura

```text
src/
  banco/
    prisma.ts
  controladores/
    venda.controlador.ts
  rotas/
    venda.rotas.ts
  servicos/
    venda.servico.ts
  aplicacao.ts
  servidor.ts
prisma/
  schema.prisma
```

## Decisoes de arquitetura

- **PostgreSQL:** banco relacional adequado para manter vendas consistentes, com restricao unica no identificador de transacao e suporte a valores decimais.
- **Zod:** valida o payload no controlador antes de qualquer persistencia, centralizando a validacao e retornando os campos invalidos.
- **Idempotencia:** o servico consulta `idTransacao` antes de inserir e trata a violacao da restricao unica. Isso tambem cobre entregas simultaneas do mesmo webhook, sem criar duplicatas.
- **Controller e Service:** separa a validacao e a resposta HTTP do acesso ao banco, mantendo o fluxo direto e simples. A escolha evita a complexidade adicional de UseCases/Arquitetura Limpa e e aderente a uma implementacao de 3-4 horas.
- **Relatorio:** as agregacoes sao calculadas pelo Prisma no banco; quantidade total inclui todos os status, enquanto receita e ticket medio incluem somente vendas aprovadas.

## Plano de execucao e commits

### Etapa 1 — Estrutura e banco de dados

Cria a configuracao TypeScript, dependencia Prisma, schema PostgreSQL e conexao compartilhada.

Teste manual:

```bash
npm install
npx prisma validate
npx prisma migrate dev --name cria_tabela_venda
```

Commit:

```bash
git add .gitignore package.json package-lock.json tsconfig.json prisma/schema.prisma src/banco/prisma.ts
git commit -m "feat: cria estrutura e modelo de vendas"
```

### Etapa 2 — Validacao e autenticacao do webhook

Implementa a rota e o controlador do webhook com validacao Zod e verificacao do segredo.

Teste manual:

```bash
curl -i http://localhost:3000/webhooks/vendas -H "Content-Type: application/json" -H "x-segredo-webhook: segredo-incorreto" -d '{}'
curl -i http://localhost:3000/webhooks/vendas -H "Content-Type: application/json" -H "x-segredo-webhook: troque-por-um-segredo-forte" -d '{}'
```

Commit:

```bash
git add package.json package-lock.json src/controladores/venda.controlador.ts src/rotas/venda.rotas.ts
git commit -m "feat: valida e autentica webhook de vendas"
```

### Etapa 3 — Persistencia idempotente

Implementa a gravacao no servico e protege contra transacoes duplicadas, inclusive em requisicoes concorrentes.

Teste manual:

```bash
curl -i http://localhost:3000/webhooks/vendas -H "Content-Type: application/json" -H "x-segredo-webhook: troque-por-um-segredo-forte" -d '{"idTransacao":"transacao-teste-1","status":"APROVADO","valor":149.90,"emailCliente":"cliente@exemplo.com"}'
curl -i http://localhost:3000/webhooks/vendas -H "Content-Type: application/json" -H "x-segredo-webhook: troque-por-um-segredo-forte" -d '{"idTransacao":"transacao-teste-1","status":"APROVADO","valor":149.90,"emailCliente":"cliente@exemplo.com"}'
```

Commit:

```bash
git add src/servicos/venda.servico.ts
git commit -m "feat: registra vendas com idempotencia"
```

### Etapa 4 — Relatorio e inicializacao da API

Adiciona agregacoes do relatorio e inicializacao do servidor com validacao de ambiente e tratamento de erros.

Teste manual:

```bash
curl -i http://localhost:3000/relatorios/vendas
npm run compilar
```

Commit:

```bash
git add src/aplicacao.ts src/servidor.ts
git commit -m "feat: disponibiliza relatorio de vendas"
```

### Etapa 5 — Container e documentacao

Documenta configuracao, exemplos e decisoes tecnicas; adiciona os arquivos para ambiente e imagem Docker.

Teste manual:

```bash
docker build -t api-vendas .
docker run --rm -p 3000:3000 -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/vendas?schema=public" -e X_SEGREDO_WEBHOOK="troque-por-um-segredo-forte" api-vendas
```

Commit:

```bash
git add Dockerfile .env.example README.md
git commit -m "docs: documenta execucao e uso da api de vendas"
```
