import assert from "node:assert/strict";
import { processAvatar } from "./avatar_pipeline.ts";

process.env.INFRAI_API_KEY = "test-key";
const requests: Array<{ path: string; body: Record<string, unknown> }> = [];
globalThis.fetch = async (url, init) => {
  const path = new URL(String(url)).pathname;
  const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
  requests.push({ path, body });
  const data = path.endsWith("/upload") ? { image: "raw-avatar" } : { image: "square-avatar" };
  return new Response(JSON.stringify({ ok: true, data, metadata: {} }), { status: 200 });
};

const result = await processAvatar({ file: "data:image/png;base64,AA==", filename: "learner.png", aspect: "1:1" });
assert.deepEqual(result, { image: "square-avatar", aspect: "1:1" });
assert.deepEqual(requests.map((request) => request.path), ["/v1/image/upload", "/v1/image/smart_crop"]);
assert.equal(requests[1].body.aspect, "1:1");
console.log("avatar decision test passed");
