# README Responsabilidade de cada arquivo

> Este arquivo é só explicativo (como pedido). Pode apagar depois.

## Infra / Deploy

- `docker-compose.yml`

  - Sobe o **LocalStack** (porta `4566`) com os serviços necessários: `lambda`, `apigateway`, `dynamodb`, `sns`, etc.
  - É o que garante que você usa os serviços AWS **localmente**.

- `serverless.yml`

  - Define o **stack serverless**:
    - Lambdas (handlers) e quais rotas HTTP elas expõem (API Gateway).
    - Recursos de infraestrutura criados via CloudFormation (DynamoDB + SNS).
    - Permissões IAM mínimas pras Lambdas acessarem DynamoDB e publicar no SNS.
    - Integração com LocalStack (plugin `serverless-localstack`) no stage `local`.

- `package.json`

  - Dependências:
    - `aws-sdk`: acesso ao DynamoDB + SNS.
    - `uuid`: gerar `id` no create.
    - `serverless` + `serverless-localstack`: deploy local.
  - Scripts: deploy/remove no stage local.

- `.gitignore`
  - Evita versionar `node_modules`, artifacts do serverless e dados locais do LocalStack.

## Código (Lambdas)

### `src/handlers/` (funções Lambda)

- `src/handlers/create.js`

  - Implementa `POST /items`
  - Valida entrada (Content-Type, JSON, campos).
  - Salva item no DynamoDB.
  - Publica notificação no SNS (`ITEM_CREATED`).
  - Retorna HTTP **201** com `{ data: item }`.

- `src/handlers/list.js`

  - Implementa `GET /items`
  - Faz `scan` na tabela (simples e suficiente pro trabalho).
  - Retorna HTTP **200** com `{ data: [...] }`.

- `src/handlers/get.js`

  - Implementa `GET /items/{id}`
  - Valida `id`.
  - Busca item no DynamoDB.
  - Retorna **200** ou **404**.

- `src/handlers/update.js`

  - Implementa `PUT /items/{id}`
  - Valida `id`, `Content-Type`, JSON e payload.
  - Atualiza item via `UpdateExpression`.
  - Publica notificação no SNS (`ITEM_UPDATED`).
  - Retorna HTTP **200** com `{ data: itemAtualizado }`.

- `src/handlers/delete.js`

  - Implementa `DELETE /items/{id}`
  - Valida `id`.
  - Confere existência (pra conseguir responder **404** corretamente).
  - Remove no DynamoDB.
  - Retorna HTTP **204** (sem body).

- `src/handlers/emailSubscriber.js`

  - Subscriber SNS (recebe eventos do tópico `items-events`).
  - “Simula envio de email” via `console.log`, pra você provar na demo que o SNS entregou a mensagem.
  - **Quando o “email” é enviado**:
    - Após **POST `/items`** com sucesso (`Subject=ITEM_CREATED`)
    - Após **PUT `/items/{id}`** com sucesso (`Subject=ITEM_UPDATED`)
    - Não é enviado em **GET/DELETE** e nem em casos de erro (**400/404/415/500**)

- `src/handlers/docs.js`

  - Implementa `GET /docs`
  - Retorna um HTML com **Swagger UI** (assets via CDN) apontando pro spec em `openapi.json` (relativo, pra funcionar com o `BASE_URL` do LocalStack).

- `src/handlers/openapi.js`
  - Implementa `GET /openapi.json`
  - Retorna o **OpenAPI 3** com todos os endpoints e responses.

### `src/lib/` (utilitários compartilhados)

- `src/lib/aws.js`

  - Cria clients `DynamoDB.DocumentClient` e `SNS`.
  - No stage `local`, aponta pro endpoint `http://localhost:4566` (LocalStack).

- `src/lib/validation.js`

  - Valida `Content-Type` (`application/json`) e retorna **415** quando necessário.
  - Faz parse do JSON e retorna **400** em JSON inválido/body vazio.
  - Valida payload de create/update (regras do enunciado).
  - Valida `id` de path param.

- `src/lib/responses.js`
  - Padroniza respostas HTTP:
    - `ok (200)`, `created (201)`, `noContent (204)`, `badRequest (400)`, `notFound (404)`, `unsupportedMediaType (415)`, `internalError (500)`
  - Mantém formato consistente de erro: `{ error, message, details }`.

## Documentação

- `README.md`
  - Como subir LocalStack, deployar e testar (explicando o que cada comando faz):
    - `docker-compose up -d`
      - Sobe o container `localstack-etapa3` em background e expõe a porta `4566` (edge do LocalStack).
      - Habilita os serviços necessários (`lambda`, `apigateway`, `dynamodb`, `sns`, `cloudformation`, `iam`, `logs`) via env `SERVICES=...`.
      - Persiste estado em `./.localstack/` (volume), então a infra pode continuar existindo entre restarts.
    - `docker ps | grep localstack-etapa3`
      - Check rápido pra confirmar que o LocalStack está rodando antes do deploy.
    - `npm install`
      - Instala deps de runtime (`aws-sdk`, `uuid`) e de deploy (`serverless`, `serverless-localstack`).
    - `npx serverless deploy --stage local` (equivalente ao `npm run deploy:local`)
      - Faz deploy do `serverless.yml` no stage `local`.
      - O plugin `serverless-localstack` redireciona CloudFormation/Serverless pro LocalStack (`http://localhost:4566`) e cria:
        - API Gateway (rotas HTTP → Lambdas)
        - DynamoDB table `items`
        - SNS topic `items-events` + subscription pra Lambda `emailSubscriber`
      - No final do deploy, o Serverless imprime a **base URL** do API (use como `BASE_URL` nos curls).
      - Em runtime, as Lambdas recebem `STAGE=local` e (via `src/lib/aws.js`) apontam DynamoDB/SNS pro endpoint do LocalStack.
    - Teste rápido via Swagger:
      - `GET ${BASE_URL}/docs`: abre Swagger UI.
      - `GET ${BASE_URL}/openapi.json`: retorna o OpenAPI.
    - Provar que o SNS disparou o subscriber:
      - Faça um `POST /items` ou `PUT /items/{id}` (são os endpoints que publicam no SNS).
      - Rode `docker logs -f localstack-etapa3` e procure por logs `[EMAIL_SIMULADO] ...` vindos da Lambda `emailSubscriber`.
    - Cleanup (remover recursos e parar infra):
      - `npx serverless remove --stage local` (equivalente ao `npm run remove:local`) remove API/Lambdas/recursos criados via stack.
      - `docker-compose down` para o container do LocalStack (se quiser zerar dados também, apague `./.localstack/`).
