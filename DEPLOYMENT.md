# Deploy da API no Railway

## Servicos

Crie no mesmo projeto Railway:

1. Um servico para este repositorio.
2. Um PostgreSQL.
3. Um Redis.

O `railway.json` executa build, migracoes Prisma, healthcheck de banco/Redis e inicio da API.

## Variaveis obrigatorias

Use `.env.production.example` como referencia. No Railway:

- `NODE_ENV=production`
- `APP_URL`: dominio publico da API com HTTPS.
- `FRONTEND_URL`: dominio de producao da Vercel.
- `CORS_ORIGINS`: lista separada por virgula de origens confiaveis.
- `DATABASE_URL`: referencia do PostgreSQL Railway.
- `REDIS_URL`: referencia privada do Redis Railway.
- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`: valores aleatorios diferentes, com 32+ caracteres.
- `SWAGGER_ENABLED=false`

Gere segredos com um gerenciador de senhas ou `openssl rand -base64 48`.

## Integracoes opcionais

Stripe e Resend ficam inativos enquanto as chaves nao forem configuradas. Ao ativa-los, configure tambem os respectivos segredos de webhook. Webhooks sem assinatura valida sao rejeitados.

## Ordem do primeiro deploy

1. Provisione PostgreSQL e Redis.
2. Cadastre todas as variaveis.
3. Gere o dominio Railway da API.
4. Atualize `APP_URL`.
5. Dispare o deploy.
6. Confirme `GET /v1/health` e `GET /v1/health/ready`.
7. Cadastre a URL final da Vercel em `FRONTEND_URL` e `CORS_ORIGINS`.

Nao execute o seed de desenvolvimento em producao.
