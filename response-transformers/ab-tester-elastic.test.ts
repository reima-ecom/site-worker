import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { FakeTime } from "https://deno.land/x/mock@v0.9.4/time.ts";
import { toElasticBulk } from "./ab-tester-elastic.ts";

Deno.test("converts to elastic bulk without index", () => {
  const experiments = [
    {
      name: "exp-test",
      variation: "treatment",
      executed: true,
    },
    {
      name: "exp-not-executed",
      variation: "treatment",
    },
    {
      name: "exp-test-2",
      variation: "control",
      executed: true,
    },
  ];
  const expected = `{"index":{}}
{"userId":"user-id","experiment":"exp-test","variation":"treatment","timestamp":"2021-02-12T00:00:00.000Z"}
{"index":{}}
{"userId":"user-id","experiment":"exp-test-2","variation":"control","timestamp":"2021-02-12T00:00:00.000Z"}
`;
  const time = new FakeTime("2021-02-12");
  const result = toElasticBulk("user-id", experiments);
  time.restore();
  assertEquals(result, expected);
});
