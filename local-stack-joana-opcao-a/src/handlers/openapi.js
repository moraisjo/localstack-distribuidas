const { json } = require("../lib/responses");

async function handler() {
  const examples = {
    item: {
      id: "8f3a3f6f-6b7a-4c56-9f8f-9d2c9a3a2d1e",
      name: "Camiseta Preta",
      description: "Camiseta 100% algodão, tamanho M.",
      createdAt: "2025-12-17T17:00:00.000Z",
      updatedAt: "2025-12-17T17:00:00.000Z"
    },
    create: {
      name: "Camiseta Preta",
      description: "Camiseta 100% algodão, tamanho M."
    },
    update: {
      name: "Camiseta Preta (atualizada)",
      description: "Agora tamanho G."
    },
    listResponse: {
      data: [
        {
          id: "8f3a3f6f-6b7a-4c56-9f8f-9d2c9a3a2d1e",
          name: "Camiseta Preta",
          description: "Camiseta 100% algodão, tamanho M.",
          createdAt: "2025-12-17T17:00:00.000Z",
          updatedAt: "2025-12-17T17:00:00.000Z"
        }
      ]
    },
    itemResponse: {
      data: {
        id: "8f3a3f6f-6b7a-4c56-9f8f-9d2c9a3a2d1e",
        name: "Camiseta Preta",
        description: "Camiseta 100% algodão, tamanho M.",
        createdAt: "2025-12-17T17:00:00.000Z",
        updatedAt: "2025-12-17T17:00:00.000Z"
      }
    },
    validationError: {
      error: "VALIDATION_ERROR",
      message: "Validação falhou.",
      details: [{ field: "name", message: "name deve ter no mínimo 3 caracteres" }]
    },
    notFoundError: {
      error: "NOT_FOUND",
      message: "Recurso não encontrado",
      details: []
    },
    unsupportedMediaTypeError: {
      error: "UNSUPPORTED_MEDIA_TYPE",
      message: "Content-Type deve ser application/json",
      details: []
    },
    internalError: {
      error: "INTERNAL_ERROR",
      message: "Erro interno",
      details: []
    }
  };

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Etapa 3 - Opção A (CRUD Items + SNS)",
      version: "1.0.0",
      description: "API CRUD /items com DynamoDB e notificações SNS (LocalStack)."
    },
    // Importante pro Swagger UI "Try it out" funcionar no LocalStack e também na AWS:
    // como o /docs e /openapi.json vivem dentro do stage base path, usar URL relativa "./"
    // faz as operações (/items, /items/{id}, etc.) irem para o mesmo base path.
    servers: [{ url: "./" }],
    paths: {
      "/items": {
        post: {
          summary: "Criar item (publica SNS)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ItemCreate" },
                examples: {
                  exemplo: { $ref: "#/components/examples/ItemCreate" }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Criado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ItemResponse" },
                  examples: {
                    exemplo: { $ref: "#/components/examples/ItemResponse" }
                  }
                }
              }
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "415": { $ref: "#/components/responses/UnsupportedMediaType" },
            "500": { $ref: "#/components/responses/InternalError" }
          }
        },
        get: {
          summary: "Listar items",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Item" }
                      }
                    }
                  },
                  examples: {
                    exemplo: { $ref: "#/components/examples/ItemsListResponse" }
                  }
                }
              }
            },
            "500": { $ref: "#/components/responses/InternalError" }
          }
        }
      },
      "/items/{id}": {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "8f3a3f6f-6b7a-4c56-9f8f-9d2c9a3a2d1e"
          }
        ],
        get: {
          summary: "Buscar item por id",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ItemResponse" },
                  examples: {
                    exemplo: { $ref: "#/components/examples/ItemResponse" }
                  }
                }
              }
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
            "500": { $ref: "#/components/responses/InternalError" }
          }
        },
        put: {
          summary: "Atualizar item (publica SNS)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ItemUpdate" },
                examples: {
                  exemplo: { $ref: "#/components/examples/ItemUpdate" }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ItemResponse" },
                  examples: {
                    exemplo: { $ref: "#/components/examples/ItemResponse" }
                  }
                }
              }
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
            "415": { $ref: "#/components/responses/UnsupportedMediaType" },
            "500": { $ref: "#/components/responses/InternalError" }
          }
        },
        delete: {
          summary: "Remover item",
          responses: {
            "204": { description: "No Content" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
            "500": { $ref: "#/components/responses/InternalError" }
          }
        }
      },
      "/docs": {
        get: {
          summary: "Swagger UI (HTML)",
          responses: { "200": { description: "OK (HTML)" } }
        }
      },
      "/openapi.json": {
        get: {
          summary: "OpenAPI spec (JSON)",
          responses: { "200": { description: "OK" } }
        }
      }
    },
    components: {
      schemas: {
        Item: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            createdAt: { type: "string" },
            updatedAt: { type: "string" }
          },
          required: ["id", "name", "createdAt", "updatedAt"]
        },
        ItemCreate: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 3, maxLength: 120 },
            description: { type: "string", maxLength: 500 }
          },
          required: ["name"]
        },
        ItemUpdate: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 3, maxLength: 120 },
            description: { type: "string", maxLength: 500 }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" }
                }
              }
            }
          },
          required: ["error", "message", "details"]
        },
        ItemResponse: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/Item" }
          },
          required: ["data"]
        }
      },
      examples: {
        ItemCreate: {
          summary: "Criar item",
          value: examples.create
        },
        ItemUpdate: {
          summary: "Atualizar item",
          value: examples.update
        },
        ItemResponse: {
          summary: "Resposta com item",
          value: examples.itemResponse
        },
        ItemsListResponse: {
          summary: "Resposta com lista de items",
          value: examples.listResponse
        },
        ErrorValidation: {
          summary: "Erro de validação (400)",
          value: examples.validationError
        },
        ErrorNotFound: {
          summary: "Não encontrado (404)",
          value: examples.notFoundError
        },
        ErrorUnsupportedMediaType: {
          summary: "Content-Type inválido (415)",
          value: examples.unsupportedMediaTypeError
        },
        ErrorInternal: {
          summary: "Erro interno (500)",
          value: examples.internalError
        }
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                exemplo: { $ref: "#/components/examples/ErrorValidation" }
              }
            }
          }
        },
        NotFound: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                exemplo: { $ref: "#/components/examples/ErrorNotFound" }
              }
            }
          }
        },
        UnsupportedMediaType: {
          description: "Unsupported Media Type",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                exemplo: { $ref: "#/components/examples/ErrorUnsupportedMediaType" }
              }
            }
          }
        },
        InternalError: {
          description: "Internal Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                exemplo: { $ref: "#/components/examples/ErrorInternal" }
              }
            }
          }
        }
      }
    }
  };

  return json(200, spec);
}

module.exports = { handler };


