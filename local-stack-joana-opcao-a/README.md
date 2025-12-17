# Etapa 3 (Opção A) — CRUD Serverless + SNS no LocalStack

Fonte do enunciado: [Etapa3.pdf](Downloads/local-stack-joana-opcao-b/Etapa3.pdf)

## Stack

- LocalStack (Docker)
- Serverless Framework
- AWS Lambda + API Gateway
- DynamoDB
- SNS (tópico + subscriber Lambda)

## Pré-requisitos

- Docker / Docker Compose
- Node.js 18+
- Serverless Framework (via `npx`)
- AWS CLI (opcional, pra provar os recursos no LocalStack)

## Subir infraestrutura (LocalStack)

```bash
docker-compose up -d
docker ps | grep localstack-etapa3
```

## Instalar dependências

```bash
npm install
```

## Deploy no LocalStack

```bash
npm start
```

Por padrão o `npm start` faz deploy em `--stage local`.

- Para outro stage:

```bash
npm start -- --stage dev
```

- Alternativa (sem o script):

```bash
npx serverless deploy --stage local
```

Ao final, ele imprime a **BASE_URL** e também os atalhos:

- 📄 `${BASE_URL}/docs`
- 🧾 `${BASE_URL}/openapi.json`

## Swagger UI (pra testar rápido)

Depois do deploy, abra:

- 📄 `${BASE_URL}/docs` (Swagger UI)
- 🧾 `${BASE_URL}/openapi.json` (OpenAPI JSON)

## Endpoints

| Método | Endpoint      | Descrição               |
| ------ | ------------- | ----------------------- |
| POST   | `/items`      | cria item + publica SNS |
| GET    | `/items`      | lista                   |
| GET    | `/items/{id}` | busca por id            |
| PUT    | `/items/{id}` | atualiza + publica SNS  |
| DELETE | `/items/{id}` | remove                  |

## Quando o “email” é enviado

Aqui o “email” é **simulado** pela Lambda `emailSubscriber` (apenas `console.log`).

O “email” é enviado (subscriber SNS é invocado) **somente** quando:

- **POST `/items`** finaliza com sucesso e publica no SNS com `Subject=ITEM_CREATED`
- **PUT `/items/{id}`** finaliza com sucesso e publica no SNS com `Subject=ITEM_UPDATED`

E **não** é enviado quando:

- **GET/DELETE** (não publicam SNS)
- Qualquer erro antes do publish (ex.: **400/404/415/500**)

## Regras de validação (entrada)

### POST `/items`

- `Content-Type: application/json` obrigatório (senão **415**)
- Body obrigatório (senão **400**)
- Campos:
  - `name`: obrigatório, string, trim, min 3, max 120
  - `description`: opcional, string, trim, max 500

### PUT `/items/{id}`

- `id` obrigatório (senão **400**)
- `Content-Type: application/json` obrigatório (senão **415**)
- Body obrigatório (senão **400**)
- Deve enviar ao menos `name` e/ou `description` (senão **400**)

## Códigos HTTP (claros)

- **201**: criado (POST)
- **200**: sucesso (GET/PUT)
- **204**: removido (DELETE)
- **400**: validação / JSON inválido / id inválido
- **404**: item não encontrado
- **415**: Content-Type inválido
- **500**: erro interno

Formato de erro (sempre JSON):

```json
{
  "error": "VALIDATION_ERROR|NOT_FOUND|UNSUPPORTED_MEDIA_TYPE|INTERNAL_ERROR",
  "message": "mensagem curta",
  "details": []
}
```

## Exemplos (curl)

> Substitua `BASE_URL` pela URL exibida no deploy (o `npm start` imprime no final).

```bash
export BASE_URL="http://localhost:4566/restapis/SEU_API_ID/local/_user_request_"
```

### Criar (POST /items)

```bash
curl -i -X POST "$BASE_URL/items" \
  -H "Content-Type: application/json" \
  -d '{"name":"Arroz","description":"5kg"}'
```

### Listar (GET /items)

```bash
curl -i "$BASE_URL/items"
```

### Buscar (GET /items/{id})

```bash
curl -i "$BASE_URL/items/SEU_ID"
```

### Atualizar (PUT /items/{id})

```bash
curl -i -X PUT "$BASE_URL/items/SEU_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"Arroz Integral"}'
```

### Remover (DELETE /items/{id})

```bash
curl -i -X DELETE "$BASE_URL/items/SEU_ID"
```

## Verificar SNS (e provar o subscriber)

O subscriber é a Lambda `emailSubscriber`. Ele **simula envio de email** via logs.

Pra ver que o SNS disparou:

1. Faça um POST ou PUT.
2. Veja logs do LocalStack:

```bash
docker logs -f localstack-etapa3
```

Você deve ver linhas do tipo:

- `[EMAIL_SIMULADO] subject= ITEM_CREATED|ITEM_UPDATED`
- `[EMAIL_SIMULADO] message= { ... }`

## Provar que os recursos estão no LocalStack (AWS CLI)

```bash
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 sns list-topics
aws --endpoint-url=http://localhost:4566 lambda list-functions
aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis
```

## Remover (cleanup)

```bash
npm run remove:local
docker-compose down
```
