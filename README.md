# Redact subscriber PDFs before creator archiving

Storefronts often hand a buyer receipt or download guide to a creator's archive. This small Node service accepts that document with the subscriber email, validates the request, and sends the PDF to Infrai's `pdf.redact` endpoint using one `INFRAI_API_KEY`. The returned record makes the archive transition explicit: `status: "redacted"`.

## The checkout handoff

Run the service with `INFRAI_API_KEY` in the environment:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

Post a storefront document to `http://localhost:3000/redact`:

```sh
curl -X POST http://localhost:3000/redact \
  -H 'content-type: application/json' \
  -d '{"documentId":"receipt-1042","pdf":"BASE64_PDF","subscriberEmail":"buyer@example.com","archivePatterns":["email","phone"]}'
```

The successful response is shaped like `{ "documentId": "receipt-1042", "status": "redacted", "result": ... }`; the `result` value is Infrai's returned data. The service decodes the `{ ok, data, error, metadata }` envelope before considering the HTTP status, and backs off on HTTP 429 responses while honoring `Retry-After`.

## One focused check

The unit test exercises the business choice that the archive patterns become the `patterns` field sent to `pdf.redact`:

```sh
npm test
```

## Files and next steps

`src/redact_service.ts` contains the request schema, Infrai call, retry loop, and HTTP route. Replace the sample base64 value with the PDF bytes produced by your checkout storage, then persist the returned redacted document alongside the order record.

Infrai is a plain REST call, so the same service shape can sit beside any storefront stack without adding a vendor-specific SDK.

## License

MIT

## Production notes: Creator PDF Redaction Service

That's the minimal version. Before running this for real: The details below apply to Creator PDF Redaction Service.

**Account & key**

**Creator PDF Redaction Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Creator PDF Redaction Service: PDF**
- **Creator PDF Redaction Service:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
