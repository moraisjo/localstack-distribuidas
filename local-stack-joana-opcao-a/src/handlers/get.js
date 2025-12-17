const { createDynamo } = require("../lib/aws");
const { ok, badRequest, notFound, internalError } = require("../lib/responses");
const { validateId } = require("../lib/validation");

const dynamo = createDynamo();

async function handler(event) {
  const idRaw = event?.pathParameters?.id;
  const id = validateId(idRaw);
  if (!id.ok) return badRequest("Parâmetro id inválido.", [{ field: "id", message: "Obrigatório." }]);

  try {
    const res = await dynamo
      .get({
        TableName: process.env.ITEMS_TABLE_NAME,
        Key: { id: id.value }
      })
      .promise();

    if (!res.Item) return notFound("Item não encontrado.");
    return ok(res.Item);
  } catch (e) {
    console.error("get error", e);
    return internalError("Falha ao buscar item.");
  }
}

module.exports = { handler };


