const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE"
};

function json(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...DEFAULT_HEADERS, ...extraHeaders },
    body: JSON.stringify(payload)
  };
}

function ok(data) {
  return json(200, { data });
}

function created(data) {
  return json(201, { data });
}

function noContent() {
  return {
    statusCode: 204,
    headers: { ...DEFAULT_HEADERS },
    body: ""
  };
}

function badRequest(message, details = []) {
  return json(400, { error: "VALIDATION_ERROR", message, details });
}

function unsupportedMediaType(message = "Content-Type deve ser application/json") {
  return json(415, { error: "UNSUPPORTED_MEDIA_TYPE", message, details: [] });
}

function notFound(message = "Recurso não encontrado") {
  return json(404, { error: "NOT_FOUND", message, details: [] });
}

function internalError(message = "Erro interno") {
  return json(500, { error: "INTERNAL_ERROR", message, details: [] });
}

module.exports = {
  json,
  ok,
  created,
  noContent,
  badRequest,
  unsupportedMediaType,
  notFound,
  internalError
};


