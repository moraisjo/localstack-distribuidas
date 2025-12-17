function handler(event) {
  const records = event?.Records || [];
  const to = "demo@pucminas.local";

  for (const r of records) {
    const sns = r.Sns || {};
    const subject = sns.Subject || "(sem-subject)";
    const message = sns.Message || "";

    console.log("[EMAIL_SIMULADO] to=", to);
    console.log("[EMAIL_SIMULADO] subject=", subject);
    console.log("[EMAIL_SIMULADO] message=", message);
  }

  return { ok: true, received: records.length };
}

module.exports = { handler };


