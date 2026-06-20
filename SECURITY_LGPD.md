# Seguranca e LGPD

Este documento e um checklist tecnico inicial e nao substitui revisao juridica.

## Controles implementados

- Senhas com Argon2 e politica minima de complexidade.
- Access token curto e refresh token rotativo armazenado somente como hash.
- Conta inativa bloqueada mesmo com access token ainda valido.
- Autorizacao por titularidade de empresa, pedido, conversa e agendamento.
- Validacao estrita de DTOs, limite de corpo de 1 MB e rate limit global/especifico.
- Helmet, CORS restrito em producao e redacao de segredos nos logs.
- Webhooks Stripe/Resend fechados por padrao e validados por assinatura.
- Respostas publicas minimizadas; hashes de senha e identificadores internos nao sao expostos.
- Exportacao dos dados do titular em `GET /v1/users/me/export`.
- Anonimizacao/desativacao em `DELETE /v1/users/me`, com confirmacao explicita.

## Inventario inicial de dados

- Identificacao: nome, email, telefone e identificadores internos.
- Endereco/localizacao: endereco informado e coordenadas opcionais.
- Operacao: agendamentos, pedidos, solicitacoes, propostas e mensagens.
- Preferencias: canais de notificacao e marketing.
- Financeiro: referencias de pagamento e assinatura, sem armazenar dados completos de cartao.
- Tecnico: logs operacionais, eventos e tokens de sessao em hash.

## Decisoes que precisam ser formalizadas

- Identidade e contato do controlador e do encarregado.
- Base legal por finalidade de tratamento.
- Tabela de retencao e descarte por categoria de dado.
- Lista de operadores/suboperadores: Railway, Vercel, Stripe, Resend e futuros provedores.
- Processo de atendimento ao titular e prazo interno.
- Plano de resposta e comunicacao de incidentes.
- Regras para criancas/adolescentes e verificacao de idade, se esse publico for permitido.
- RIPD quando o tratamento ou escala justificar.

## Antes de abrir ao publico

- Publicar politica de privacidade e termos revisados juridicamente.
- Configurar emails reais de privacidade/suporte.
- Ativar MFA nas contas Railway, Vercel, GitHub, Stripe e Resend.
- Restringir acesso de equipe pelo menor privilegio.
- Habilitar backups e testar restauracao do PostgreSQL.
- Definir alertas para erros, disponibilidade e uso anormal.
- Criar rotina de atualizacao de dependencias e revisao trimestral de acessos.
