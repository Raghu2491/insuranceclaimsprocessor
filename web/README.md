# Claim Processor — Web Frontend (React + TypeScript, Vite)

A simple UI to submit an insurance claim: type or load claim text, then upload
it as a `.txt` file to Amazon S3 (under the `claims/` prefix).

## Run it

```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

With no backend configured it runs in **MOCK mode** — the upload is simulated so
you can build and click through the UI. To upload to your real bucket, set the
API endpoint (the presigned-URL Lambda we add next):

```bash
cp .env.example .env
# edit .env -> VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
```

## How upload works

Browsers can't write to a private S3 bucket directly. The flow is:
1. UI asks the backend `GET /upload-url?filename=claim.txt`
2. Backend returns a short-lived **presigned S3 PUT URL** + the object key
3. UI `PUT`s the file straight to S3 using that URL

(The backend endpoint is provisioned by the CDK stack — next step.)
