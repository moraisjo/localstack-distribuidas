#!/usr/bin/env node
/* eslint-disable no-console */

const { spawn } = require("node:child_process");
const path = require("node:path");

/**
 * Analisa os argumentos da linha de comando para encontrar o valor de um argumento específico.
 * @param {string} name O nome do argumento a ser procurado (ex: "--stage").
 * @returns {string | undefined} O valor do argumento, ou undefined se não for encontrado.
 */
function parseArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

/**
 * Extrai o URL do endpoint da saída do comando Serverless.
 * @param {string} output A saída (stdout/stderr) do processo Serverless.
 * @returns {string | undefined} O URL do endpoint, ou undefined se não for encontrado.
 */
function parseEndpointFromOutput(output) {
  // Serverless prints: "endpoint: http://localhost:4566/restapis/xxxx/local/_user_request_"
  const match = output.match(/^\s*endpoint:\s*(https?:\/\/\S+)\s*$/m);
  return match?.[1];
}

/**
 * Função principal que executa o deploy do serviço Serverless e extrai o endpoint.
 *
 * Ele realiza as seguintes etapas:
 * 1. Determina o 'stage' para o deploy.
 * 2. Executa `serverless deploy` em um processo filho.
 * 3. Captura a saída do processo.
 * 4. Analisa a saída para encontrar o URL base do endpoint.
 * 5. Imprime o URL base e os links para a documentação do Swagger.
 */
async function main() {
  const stage = parseArg("--stage") || process.env.STAGE || "local";
  const slsBin = path.resolve(process.cwd(), "node_modules/.bin/serverless");

  const args = ["deploy", "--stage", stage];
  const child = spawn(slsBin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  let out = "";
  let err = "";

  child.stdout.on("data", (chunk) => {
    const s = chunk.toString();
    out += s;
    process.stdout.write(s);
  });

  child.stderr.on("data", (chunk) => {
    const s = chunk.toString();
    err += s;
    process.stderr.write(s);
  });

  const code = await new Promise((resolve) => child.on("close", resolve));
  if (code !== 0) process.exit(code || 1);

  const baseUrl = parseEndpointFromOutput(out + "\n" + err);
  if (!baseUrl) {
    console.error(
      "\nNão consegui extrair o BASE_URL do output do Serverless (linha `endpoint:`)."
    );
    process.exit(1);
  }

  console.log("\nBASE_URL:", baseUrl);
  console.log("📄 Swagger UI:", `${baseUrl}/docs`);
  console.log("🧾 OpenAPI JSON:", `${baseUrl}/openapi.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


