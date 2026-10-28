import assert from "node:assert/strict";
import { buildRedactionPayload } from "./redact_service.js";

const payload = buildRedactionPayload({
  documentId: "receipt-1042",
  pdf: "base64-pdf",
  subscriberEmail: "buyer@example.com",
  archivePatterns: ["email", "phone"]
});

assert.deepEqual(payload, { pdf: "base64-pdf", patterns: ["email", "phone"] });
console.log("archive pattern decision passed");
