# Pranavi CRM

Professional-grade CRM foundation with a local backend, left-rail integration workspace, and a Cloudflare Pages-compatible public demo deployment.

## Run locally

```bash
npm start
```

Then open:

```bash
http://localhost:3000
```

## Local credential files

The app reads credentials from `.env` automatically on startup.

Starter files included:

- `.env`
- `.env.example`

## Required local values

```bash
APP_BASE_URL=http://localhost:3000
PORT=3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_SCOPE=openid profile email

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

## Callback URLs to register

Use these exact redirect URLs in the provider dashboards:

- Google: `http://localhost:3000/api/auth/google/callback`
- Microsoft: `http://localhost:3000/api/auth/microsoft/callback`
- LinkedIn: `http://localhost:3000/api/auth/linkedin/callback`

## Provider notes

### Google

Create a Web application OAuth client and set:

- Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`

### Microsoft

Create an app registration and set:

- Redirect URI type: Web
- Redirect URI: `http://localhost:3000/api/auth/microsoft/callback`

### LinkedIn

Create a LinkedIn app and set:

- Redirect URL: `http://localhost:3000/api/auth/linkedin/callback`
- `LINKEDIN_SCOPE` must match only the scopes your LinkedIn app is actually approved for

## Current login behavior

- Gmail: real OAuth start and callback flow wired for the local Node server
- Outlook: real OAuth start and callback flow wired for the local Node server
- LinkedIn: real OAuth start and callback flow wired for the local Node server, but only works when your app has approved scopes
- WhatsApp: placeholder local connect state until Meta Business API/webhooks are configured

## Cloudflare Pages deployment

This repo now includes `public/_worker.js`, which uses Cloudflare Pages Functions advanced mode.
That gives you a public `*.pages.dev` subdomain while serving the UI from `public/` and handling `/api/*` from the Worker.

### Pages setup

1. Push this repo to GitHub.
2. In Cloudflare, go to `Workers & Pages`.
3. Create a new application.
4. Choose `Pages`.
5. Import your GitHub repository.
6. Use these build settings:

```text
Production branch: main
Build command: exit 0
Build output directory: public
```

7. Deploy the project.
8. Cloudflare will give you a production subdomain like:

```text
https://<your-project>.pages.dev
```

## Add your own subdomain or domain

After the Pages project is live:

1. Open your Pages project in Cloudflare.
2. Go to `Custom domains`.
3. Choose `Set up a domain`.
4. Enter the subdomain or domain you want.

If you are attaching a subdomain from external DNS, create a `CNAME` pointing your subdomain to:

```text
<your-project>.pages.dev
```

Important: add the custom domain inside the Cloudflare Pages dashboard first, then add the DNS record. If you only add the CNAME manually without associating it in Pages, Cloudflare can fail to resolve it correctly.

## Cloudflare Pages caveat

The Pages deployment is meant for a public demo / preview URL.

Current limitation:

- `public/_worker.js` uses in-memory demo state on Cloudflare Pages.
- Real OAuth callbacks and persistent CRM data are still best handled by the local Node server or a future Cloudflare storage-backed version using KV / D1 / Durable Objects.
- WhatsApp webhook verification works in Pages mode, but outbound sending is intentionally disabled in the demo deployment.

## Important

The local Node app is the production-ready path in this repo today.
The Cloudflare Pages deployment is the fastest way to get a shareable subdomain and visually check the CRM online.