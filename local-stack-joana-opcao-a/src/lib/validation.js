function normalizeHeaderName(headers = {}, name) {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

function ensureJsonContentType(event) {
  const ct = normalizeHeaderName(event.headers || {}, "content-type");
  if (!ct) return { ok: false, reason: "missing" };
  if (!ct.toLowerCase().includes("application/json")) return { ok: false, reason: "invalid", value: ct };
  return { ok: true };
}

function parseJsonBody(event) {
  if (!event || typeof event.body !== "string" || event.body.trim() === "") {
    return { ok: false, error: "EMPTY_BODY" };
  }

  try {
    const parsed = JSON.parse(event.body);
    return { ok: true, value: parsed };
  } catch (e) {
    return { ok: false, error: "INVALID_JSON" };
  }
}

function validateCreateOrUpdatePayload(payload, { requireName, allowEmpty } = {}) {
  const details = [];
  const out = {};

  const hasName = Object.prototype.hasOwnProperty.call(payload, "name");
  const hasDescription = Object.prototype.hasOwnProperty.call(payload, "description");

  if (!allowEmpty && !hasName && !hasDescription) {
    details.push({ field: "*", message: "Informe ao menos um campo para atualizar (name e/ou description)." });
  }

  if (requireName && !hasName) {
    details.push({ field: "name", message: "Campo obrigatório." });
  }

  if (hasName) {
    const name = payload.name;
    if (typeof name !== "string") {
      details.push({ field: "name", message: "Deve ser string." });
    } else {
      const trimmed = name.trim();
      if (trimmed.length < 3) details.push({ field: "name", message: "Mínimo 3 caracteres." });
      if (trimmed.length > 120) details.push({ field: "name", message: "Máximo 120 caracteres." });
      out.name = trimmed;
    }
  }

  if (hasDescription) {
    const description = payload.description;
    if (typeof description !== "string") {
      details.push({ field: "description", message: "Deve ser string." });
    } else {
      const trimmed = description.trim();
      if (trimmed.length > 500) details.push({ field: "description", message: "Máximo 500 caracteres." });
      out.description = trimmed;
    }
  }

  return { ok: details.length === 0, details, value: out };
}

function validateId(id) {
  if (!id || typeof id !== "string" || id.trim() === "") return { ok: false };
  return { ok: true, value: id.trim() };
}

module.exports = {
  ensureJsonContentType,
  parseJsonBody,
  validateCreateOrUpdatePayload,
  validateId
};


