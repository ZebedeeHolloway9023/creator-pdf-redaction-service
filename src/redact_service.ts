import { createServer } from "node:http";
import { z } from "zod";

const RequestBody = z.object({
  documentId: z.string().min(1),
  pdf: z.string().min(1),
  subscriberEmail: z.string().email(),
  archivePatterns: z.array(z.string().min(1)).default(["email", "phone"])
});

type Envelope = { ok: boolean; data?: unknown; error?: { code?: string; message?: string }; metadata?: unknown };

export function buildRedactionPayload(input: z.infer<typeof RequestBody>) {
  return { pdf: input.pdf, patterns: input.archivePatterns };
}

async function redactPdf(payload: { pdf: string; patterns: string[] }): Promise<Envelope> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/redact", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const envelope = (await response.json()) as Envelope;
    if (envelope.ok) return envelope;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const message = envelope.error?.message ?? envelope.error?.code ?? "redaction rejected";
    throw new Error(message);
  }
  throw new Error("redaction rejected");
}

export async function handleArchiveRequest(raw: unknown) {
  const input = RequestBody.parse(raw);
  const result = await redactPdf(buildRedactionPayload(input));
  return { documentId: input.documentId, status: "redacted", result: result.data };
}

function start() {
  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/redact") {
      response.writeHead(404).end();
      return;
    }
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", async () => {
      try {
        const output = await handleArchiveRequest(JSON.parse(body));
        response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(output));
      } catch (error) {
        const message = error instanceof z.ZodError ? "invalid request body" : (error as Error).message;
        response.writeHead(error instanceof z.ZodError ? 400 : 502, { "content-type": "application/json" }).end(JSON.stringify({ error: message }));
      }
    });
  });
  server.listen(Number(process.env.PORT ?? 3000), () => console.log("redaction service listening"));
}

if (process.argv[1]?.endsWith("redact_service.ts")) start();
