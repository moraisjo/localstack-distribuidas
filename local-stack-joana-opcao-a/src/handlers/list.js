const { createDynamo } = require("../lib/aws");
const { ok, internalError } = require("../lib/responses");

const dynamo = createDynamo();

async function handler() {
  try {
    const res = await dynamo
      .scan({
        TableName: process.env.ITEMS_TABLE_NAME
      })
      .promise();

    return ok(res.Items || []);
  } catch (e) {
    console.error("list error", e);
    return internalError("Falha ao listar items.");
  }
}

module.exports = { handler };


