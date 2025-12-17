const { createDynamo, createSNS } = require("../lib/aws");
const {
  ok,
  badRequest,
  notFound,
  internalError,
  unsupportedMediaType
} = require("../lib/responses");
const {
  ensureJsonContentType,
  parseJsonBody,
  validateCreateOrUpdatePayload,
  validateId
} = require("../lib/validation");

const dynamo = createDynamo();
const sns = createSNS();

function buildUpdateExpression(fields) {
  const names = {};
  const values = {};
  const sets = [];

  for (const [k, v] of Object.entries(fields)) {
    const nameKey = `#${k}`;
    const valueKey = `:${k}`;
    names[nameKey] = k;
    values[valueKey] = v;
    sets.push(`${nameKey} = ${valueKey}`);
  }

  return {
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values
  };
}

async function handler(event) {
  const idRaw = event?.pathParameters?.id;
  const id = validateId(idRaw);
  if (!id.ok) return badRequest("Parâmetro id inválido.", [{ field: "id", message: "Obrigatório." }]);

  const ct = ensureJsonContentType(event);
  if (!ct.ok) return unsupportedMediaType();

  const parsed = parseJsonBody(event);
  if (!parsed.ok) {
    return badRequest(parsed.error === "INVALID_JSON" ? "JSON inválido." : "Body obrigatório.");
  }

  const validated = validateCreateOrUpdatePayload(parsed.value, { requireName: false, allowEmpty: false });
  if (!validated.ok) return badRequest("Payload inválido.", validated.details);

  const now = new Date().toISOString();
  const fieldsToUpdate = {
    ...(validated.value.name !== undefined ? { name: validated.value.name } : {}),
    ...(validated.value.description !== undefined ? { description: validated.value.description } : {}),
    updatedAt: now
  };

  try {
    const existing = await dynamo
      .get({
        TableName: process.env.ITEMS_TABLE_NAME,
        Key: { id: id.value }
      })
      .promise();

    if (!existing.Item) return notFound("Item não encontrado.");

    const expr = buildUpdateExpression(fieldsToUpdate);
    const updated = await dynamo
      .update({
        TableName: process.env.ITEMS_TABLE_NAME,
        Key: { id: id.value },
        ...expr,
        ReturnValues: "ALL_NEW"
      })
      .promise();

    await sns
      .publish({
        TopicArn: process.env.ITEM_EVENTS_TOPIC_ARN,
        Subject: "ITEM_UPDATED",
        Message: JSON.stringify({
          eventType: "ITEM_UPDATED",
          itemId: id.value,
          timestamp: now,
          item: updated.Attributes
        })
      })
      .promise();

    return ok(updated.Attributes);
  } catch (e) {
    console.error("update error", e);
    return internalError("Falha ao atualizar item.");
  }
}

module.exports = { handler };


