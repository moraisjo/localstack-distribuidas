const { createDynamo } = require("../lib/aws");
const {
  badRequest,
  notFound,
  noContent,
  internalError,
} = require("../lib/responses");
const { validateId } = require("../lib/validation");

const dynamo = createDynamo();

async function handler(event) {
  const idRaw = event?.pathParameters?.id;
  const id = validateId(idRaw);
  if (!id.ok)
    return badRequest("Parâmetro id inválido.", [
      { field: "id", message: "Obrigatório." },
    ]);

  try {
    const existing = await dynamo
      .get({
        TableName: process.env.ITEMS_TABLE_NAME,
        Key: { id: id.value },
      })
      .promise();

    if (!existing.Item) return notFound("Item não encontrado.");

    await dynamo
      .delete({
        TableName: process.env.ITEMS_TABLE_NAME,
        Key: { id: id.value },
      })
      .promise();

    return noContent();
  } catch (e) {
    console.error("delete error", e);
    return internalError("Falha ao remover item.");
  }
}

module.exports = { handler };
