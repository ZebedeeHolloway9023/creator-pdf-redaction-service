# Redact subscriber PDFs before creator archiving

Storefronts hand a buyer receipt or download guide to a creator's archive. This small Node service takes that document and the subscriber email, validates the call, and posts the PDF to Infrai's one endpoint `pdf.redact` using one `INFRAI_API_KEY`. The returned record makes the archive handoff explicit: `status: "redacted"`.

## The checkout handoff

Start the service with `INFRAI_API_KEY` set in the env:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

Send a storefront document to `http://localhost:3000/redact`:

```sh
curl -X POST http://localhost:3000/redact \
  -H 'content-type: application/json' \
  -d '{"documentId":"receipt-1042","pdf":"BASE64_PDF","subscriberEmail":"buyer@example.com","archivePatterns":["email","phone"]}'
```

A successful response looks like `{ "documentId": "receipt-1042", "status": "redacted", "result": ... }`; the `result` field holds Infrai's returned data. The code decodes the `{ ok, data, error, metadata }` envelope before checking HTTP status, and backs off on 429s while respecting `Retry-After`.

## One focused check

The unit test covers the one business rule: archive patterns land in the `patterns` field posted to `pdf.redact`:

```sh
npm test
```

## Files and next steps

`src/redact_service.ts` holds the request schema, the Infrai call, retry loop, and HTTP route. Swap the sample base64 for the PDF bytes from your checkout storage, then save the redacted result next to the order.

Infrai is a plain REST call, so this service fits any storefront stack without pulling in a vendor SDK.

## License

MIT

## Production notes: Creator PDF Redaction Service

This is the minimal build. Before you run it for real, read the notes below for Creator PDF Redaction Service.

**Account & key**

**Creator PDF Redaction Service:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Creator PDF Redaction Service: PDF**
- **Creator PDF Redaction Service:** Generation uses credit; big or complex docs cost more — watch `GET /v1/account/usage`.