# SLOTY API Backend

API REST production-ready para o SLOTY, construída com NestJS, Fastify, Prisma, PostgreSQL, Redis, BullMQ, JWT, Swagger, Resend e Stripe.

## Stack

- NestJS + Fastify
- PostgreSQL + Prisma ORM
- Redis + BullMQ
- JWT access token + refresh token rotativo
- Swagger/OpenAPI em `/docs`
- Resend para emails transacionais
- Stripe para billing SaaS
- class-validator + class-transformer
- Docker Compose para Postgres e Redis
- Testes unitários e e2e

## Estrutura

- `src/auth`: registro, login, refresh, logout e `me`
- `src/users`: perfil do usuário autenticado
- `src/businesses`: gestão e leitura pública de empresas
- `src/services`: catálogo de serviços da empresa
- `src/availability`: disponibilidade semanal, closures e cálculo dinâmico de slots
- `src/appointments`: criação transacional, status e histórico de eventos
- `src/emails`: filas, templates e logs de email
- `src/notifications`: eventos internos e criação de notifications
- `src/billing`: checkout SaaS e sincronização de assinatura
- `src/webhooks`: validação e ingestão de webhooks Stripe/Resend
- `src/uploads`: endpoint isolado para presign de object storage
- `src/queue`: Redis, BullMQ e processors
- `src/common`: guards, decorators, filters e utilitários compartilhados
- `prisma`: schema, migration inicial e seed

## Setup

1. Instale dependências:

```bash
pnpm install
```

2. Copie o env:

```bash
cp .env.example .env
```

3. Suba Postgres e Redis:

```bash
docker compose up -d
```

4. Gere o client e aplique migrations:

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
```

5. Rode o seed:

```bash
pnpm prisma:seed
```

6. Inicie a API:

```bash
pnpm start:dev
```

## Scripts principais

```bash
pnpm start:dev
pnpm start:prod
pnpm build
pnpm test
pnpm test:unit
pnpm test:e2e
pnpm prisma:studio
pnpm prisma:seed
```

## Ambiente

Variáveis esperadas:

- `NODE_ENV`
- `PORT`
- `APP_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`
- `DATABASE_URL`
- `REDIS_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO`
- `SWAGGER_ENABLED`

## Swagger

- Docs: `http://localhost:3000/docs`
- Prefix da API: `http://localhost:3000/v1`

## Seed inicial

Após `pnpm prisma:seed`, ficam disponíveis:

- Owner: `owner@sloty.local`
- Client: `client@sloty.local`
- Senha padrão: `Password123!`
- 1 empresa ativa
- 2 serviços
- disponibilidade semanal
- 1 closure
- appointments com status `CONFIRMED`, `PENDING` e `CANCELLED`

## Fluxo local recomendado

1. `docker compose up -d`
2. `pnpm prisma:migrate:dev`
3. `pnpm prisma:seed`
4. `pnpm start:dev`
5. Abrir `/docs`

## Stripe CLI

Para testar webhook localmente:

```bash
stripe listen --forward-to localhost:3000/v1/webhooks/stripe
```

Copie o secret gerado pelo CLI para `STRIPE_WEBHOOK_SECRET`.

## Resend

1. Configure `RESEND_API_KEY`
2. Configure `RESEND_FROM_EMAIL`
3. Configure `RESEND_WEBHOOK_SECRET`
4. Aponte o webhook do Resend para:

```text
POST http://localhost:3000/v1/webhooks/resend
```

## Exemplos de chamadas

Registrar cliente:

```bash
curl -X POST http://localhost:3000/v1/auth/register/client \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Costa",
    "email": "ana@example.com",
    "password": "StrongPass123!"
  }'
```

Login:

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@sloty.local",
    "password": "Password123!"
  }'
```

Consultar slots:

```bash
curl "http://localhost:3000/v1/availability/businesses/BUSINESS_ID/services/SERVICE_ID/slots?date=2026-04-14"
```

Criar appointment:

```bash
curl -X POST http://localhost:3000/v1/appointments \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Idempotency-Key: appt-001" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "BUSINESS_ID",
    "serviceId": "SERVICE_ID",
    "startAt": "2026-04-14T15:00:00.000Z"
  }'
```

Criar checkout SaaS:

```bash
curl -X POST http://localhost:3000/v1/billing/checkout/subscription \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Observações

- Datas são persistidas em UTC.
- Regras de disponibilidade usam o timezone da empresa.
- `PENDING` e `CONFIRMED` bloqueiam slots; `CANCELLED` e `NO_SHOW` nao bloqueiam.
- A criacao de appointment usa transacao Prisma + advisory lock do PostgreSQL.
- O endpoint de upload retorna presign placeholder pronto para trocar por S3/R2.
- Quando `STRIPE_SECRET_KEY` ou `RESEND_API_KEY` nao estao configurados, os fluxos externos entram em modo seguro para desenvolvimento/teste.
