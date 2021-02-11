import type { ExperimentHitSender, Experiments } from "./ab-test-rewriter.ts";

declare const ELASTIC_APIKEY_BASE64: string;

export const toElasticBulk = (
  userId: string,
  experiments: Experiments,
): string =>
  experiments
    .filter((exp) => exp.executed)
    .map((exp) => ({
      userId: userId,
      experiment: exp.name,
      variation: exp.variation,
      timestamp: new Date(),
    }))
    .map((exp) => `{"index":{}}\n${JSON.stringify(exp)}\n`)
    .join("");

export const sendToElastic: ExperimentHitSender = async (
  userId,
  experiments,
) => {
  const resp = await fetch(
    "https://21ca8fec9bcd4a7ba46d584c59d76fa0.eastus2.azure.elastic-cloud.com:9243/experiments/_bulk",
    {
      method: "POST",
      body: toElasticBulk(userId, experiments),
      headers: {
        "Content-Type": "application/x-ndjson",
        Authorization: `ApiKey ${ELASTIC_APIKEY_BASE64}`,
      },
    },
  );
  console.log(resp.status, resp.statusText);
  console.log(await resp.json());
};
