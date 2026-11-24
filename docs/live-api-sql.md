# Live API SQL no Portal

O Workbench existente agora mostra fontes API REST em uma seção própria da
barra lateral. A importação OpenAPI, a execução SQL e o acompanhamento de
progresso passam por `/api/sql/live/*`, que valida a permissão master admin
e encaminha ao FastAPI local. O navegador não recebe a chave interna nem
credenciais da API externa. As conexões MySQL mantêm as rotas e executor
anteriores.

Configure `.env.local` com `LIVE_API_URL=http://127.0.0.1:8001` e
`LIVE_API_INTERNAL_KEY` igual ao valor de `_PY/.env.live`. Inicie com
`npm run dev`, a partir da raiz do Portal. O backend deve estar
iniciado em `127.0.0.1:8001` com um worker. No checkout local com alterações
em `package.json` e `package-lock.json`, preserve o `node_modules` existente;
não rode `npm ci` antes de revisar essas alterações.

As instruções completas de importação, orçamento, sintaxe SQL, credenciais,
testes e encerramento estão em `../_PY/docs/live-api-sql.md` nos checkouts
irmãos usados nesta implementação.

## Produção

O deploy da branch `prod` lê os secrets `LIVE_API_URL` e
`LIVE_API_INTERNAL_KEY` do GitHub Actions. Configure a mesma chave interna no
FastAPI de produção e use uma URL que o servidor do Portal consiga alcançar.
O FastAPI deve estar ativo antes de usar as fontes REST no Workbench. O
catálogo `.live_api` e os tokens OAuth do tenant são locais e não acompanham o
Git; configure o tenant e importe a conexão novamente no ambiente de produção.
