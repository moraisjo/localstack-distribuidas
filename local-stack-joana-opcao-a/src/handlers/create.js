const { v4: uuidv4 } = require("uuid");
const { createDynamo, createSNS } = require("../lib/aws");
const {
  created,
  badRequest,
  internalError,
  unsupportedMediaType
} = require("../lib/responses");
const {
  ensureJsonContentType,
  parseJsonBody,
  validateCreateOrUpdatePayload
} = require("../lib/validation");

const dynamo = createDynamo();
const sns = createSNS();

async function handler(event) {
  const ct = ensureJsonContentType(event);
  if (!ct.ok) return unsupportedMediaType();

  const parsed = parseJsonBody(event);
  if (!parsed.ok) {
    return badRequest(parsed.error === "INVALID_JSON" ? "JSON inválido." : "Body obrigatório.");
  }

  const validated = validateCreateOrUpdatePayload(parsed.value, { requireName: true, allowEmpty: false });
  if (!validated.ok) return badRequest("Payload inválido.", validated.details);

  const now = new Date().toISOString();
  const item = {
    id: uuidv4(),
    name: validated.value.name,
    ...(validated.value.description !== undefined ? { description: validated.value.description } : {}),
    createdAt: now,
    updatedAt: now
  };

  try {
    await dynamo
      .put({
        TableName: process.env.ITEMS_TABLE_NAME,
        Item: item
      })
      .promise();

    await sns
      .publish({
        TopicArn: process.env.ITEM_EVENTS_TOPIC_ARN,
        Subject: "ITEM_CREATED",
        Message: JSON.stringify({
          eventType: "ITEM_CREATED",
          itemId: item.id,
          timestamp: now,
          item
        })
      })
      .promise();

    return created(item);
  } catch (e) {
    console.error("create error", e);
    return internalError("Falha ao criar item.");
  }
}

module.exports = { handler };


