# Deploy (free) on Render

The repo is public at:
**https://github.com/smit-suthar-swirl/car-voice-assistant**

It deploys as **one free web service** (Node server that serves the built React
client + the API) plus **one free Postgres** (with pgvector). No Redis — the app
uses an in-memory cache fallback automatically.

Everything is defined in `render.yaml` (Render Blueprint).

## Deploy in ~3 clicks

1. Open this link (sign in to Render with your GitHub — free, no credit card):

   **https://render.com/deploy?repo=https://github.com/smit-suthar-swirl/car-voice-assistant**

2. Render reads `render.yaml` and shows: a **web service** + a **Postgres** database.
   It will ask for one secret env var — set:

   ```
   GEMINI_API_KEY = <your Gemini API key>
   ```

3. Click **Apply**. Render will:
   - provision free Postgres
   - build the client + server
   - run pre-deploy: create pgvector extension → push schema → seed cars,
     reviews & videos (with embeddings) → build HNSW indexes
   - start the web service and give you a public `*.onrender.com` URL

Open that URL → pick Honda → Civic → tap the mic.

## Notes
- Free web services **sleep after ~15 min idle**; the first request after that
  has a ~30–50s cold start. Fine for a demo.
- Free Postgres is fine for pgvector; the pre-deploy step creates the extension.
- To redeploy after code changes: `git push` (Render auto-deploys from `master`).
