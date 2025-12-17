const AWS = require("aws-sdk");

function resolveEndpoint() {
  if (
    process.env.AWS_ENDPOINT_URL &&
    process.env.AWS_ENDPOINT_URL.trim() !== ""
  ) {
    return process.env.AWS_ENDPOINT_URL.trim();
  }
  if (process.env.STAGE === "local") {
    return "http://localhost:4566";
  }
  return undefined;
}

function createDynamo() {
  const endpoint = resolveEndpoint();
  return new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || "us-east-1",
    ...(endpoint ? { endpoint } : {}),
  });
}

function createSNS() {
  const endpoint = resolveEndpoint();
  return new AWS.SNS({
    region: process.env.AWS_REGION || "us-east-1",
    ...(endpoint ? { endpoint } : {}),
  });
}

module.exports = {
  createDynamo,
  createSNS,
};
