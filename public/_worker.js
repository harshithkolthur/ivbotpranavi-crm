const ALLOWED_HOSTS = new Set(["ivbotpranavi.com", "www.ivbotpranavi.com", "ivbotpranavi-crm.pages.dev"]);

const defaultData = {
  integrations: {
    whatsapp: {
      connected: false,
      status: "Business API ready",
      scope: "Messages, templates, replies",
      lastSync: "Not synced yet",
      account: null,
    },
    gmail: {
      connected: false,
      status: "OAuth ready",
      scope: "Email, meetings, tasks",
      lastSync: "Not synced yet",
      account: null,
    },
    outlook: {
      connected: false,
      status: "OAuth ready",
      scope: "Email, calendar, directory",
      lastSync: "Not synced yet",
      account: null,
    },
    linkedin: {
      connected: false,
      status: "OAuth ready",
      scope: "Login, profile, email",
      lastSync: "Not synced yet",
      account: null,
    },
  },
  contacts: [
    {
      id: "contact_1",
      name: "Ava Johnson",
      company: "Acme Corp",
      title: "VP Sales",
      email: "ava@acmecorp.com",
      stage: "Qualified",
      source: "Gmail",
      lastActivity: "Replied to proposal thread",
    },
    {
      id: "contact_2",
      name: "Marcus Lee",
      company: "Northstar Health",
      title: "Operations Director",
      email: "marcus@northstarhealth.com",
      stage: "New lead",
      source: "LinkedIn",
      lastActivity: "Viewed profile and saved account",
    },
    {
      id: "contact_3",
      name: "Priya Raman",
      company: "Blue Orbit",
      title: "Founder",
      email: "priya@blueorbit.io",
      stage: "Proposal",
      source: "Outlook",
      lastActivity: "Booked follow-up meeting",
    },
    {
      id: "contact_4",
      name: "Diego Alvarez",
      company: "BrightPath Logistics",
      title: "Commercial Lead",
      email: "diego@brightpathlogistics.com",
      stage: "Qualified",
      source: "WhatsApp",
      lastActivity: "Sent pricing question over WhatsApp",
    },
  ],
  deals: [
    { id: "deal_1", name: "Acme Expansion", value: 42000, stage: "Proposal" },
    { id: "deal_2", name: "Northstar Pilot", value: 18000, stage: "Qualified" },
    { id: "deal_3", name: "Blue Orbit Retainer", value: 27000, stage: "Won" },
  ],
  activity: [
    {
      id: "act_1",
      source: "System",
      time: "09:14",
      message: "CRM workspace initialized and ready for channel connections.",
    },
    {
      id: "act_2",
      source: "WhatsApp",
      time: "09:48",
      message: "WhatsApp Business channel added to the connection surface.",
    },
    {
      id: "act_3",
      source: "Gmail",
      time: "10:02",
      message: "OAuth flow available when Google client credentials are configured.",
    },
    {
      id: "act_4",
      source: "Outlook",
      time: "11:37",
      message: "Microsoft Graph sync can start after Azure app registration.",
    },
  ],
  authStates: {},
  tokens: {},
  credentials: {
    gmail: { clientId: "", clientSecret: "" },
    outlook: { clientId: "", clientSecret: "", tenantId: "common" },
    linkedin: { clientId: "", clientSecret: "", scope: "openid profile email" },
    whatsapp: {
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: "",
      webhookVerifyToken: "",
    },
  },
};

function cloneDefaultData() {
  return structuredClone(defaultData);
}

function getData() {
  if (!globalThis.__pranaviPagesData) {
    globalThis.__pranaviPagesData = cloneDefaultData();
  }

  return globalThis.__pranaviPagesData;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function redirect(location) {
  return Response.redirect(location, 302);
}

async function parseBody(request) {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
}

function nowLabel() {
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function addActivity(data, source, message) {
  data.activity.unshift({
    id: `act_${crypto.randomUUID()}`,
    source,
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    message,
  });
  data.activity = data.activity.slice(0, 12);
}

function providerLabel(provider) {
  if (provider === "gmail") return "Gmail";
  if (provider === "outlook") return "Outlook";
  if (provider === "linkedin") return "LinkedIn";
  return "WhatsApp";
}

function resetStatus(provider) {
  return provider === "whatsapp" ? "Business API ready" : "OAuth ready";
}

function summariseLastSync(integrations) {
  const connected = Object.values(integrations)
    .filter((integration) => integration.connected)
    .map((integration) => integration.lastSync)
    .find((value) => value && value !== "Not synced yet");

  return connected || "Awaiting first sync";
}

function credentialsSnapshot(data) {
  return {
    gmail: {
      clientId: data.credentials.gmail.clientId,
      hasClientSecret: Boolean(data.credentials.gmail.clientSecret),
    },
    outlook: {
      clientId: data.credentials.outlook.clientId,
      hasClientSecret: Boolean(data.credentials.outlook.clientSecret),
      tenantId: data.credentials.outlook.tenantId || "common",
    },
    linkedin: {
      clientId: data.credentials.linkedin.clientId,
      hasClientSecret: Boolean(data.credentials.linkedin.clientSecret),
      scope: data.credentials.linkedin.scope || "",
    },
    whatsapp: {
      hasAccessToken: Boolean(data.credentials.whatsapp.accessToken),
      phoneNumberId: data.credentials.whatsapp.phoneNumberId || "",
      businessAccountId: data.credentials.whatsapp.businessAccountId || "",
      hasWebhookVerifyToken: Boolean(data.credentials.whatsapp.webhookVerifyToken),
    },
  };
}

function appBaseUrl(request) {
  return new URL(request.url).origin;
}

function oauthUnsupportedRedirect(request, provider) {
  const message = `${providerLabel(provider)} OAuth is disabled on the Cloudflare Pages demo deployment. Use the local Node server or add durable Cloudflare storage for production auth state.`;
  return redirect(`${appBaseUrl(request)}/?error=${encodeURIComponent(message)}`);
}

function collectWhatsappMessages(payload) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  return entries
    .flatMap((entry) => entry?.changes || [])
    .map((change) => change?.value)
    .filter(Boolean)
    .flatMap((value) => value?.messages || []);
}

async function handleApi(request, env, url) {
  const data = getData();

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true, timestamp: new Date().toISOString(), runtime: "cloudflare-pages" });
  }

  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    return json({
      summary: {
        connectedChannels: Object.values(data.integrations).filter((integration) => integration.connected).length,
        contactsCaptured: data.contacts.length,
        openOpportunities: data.deals.filter((deal) => deal.stage !== "Won").length,
        lastSync: summariseLastSync(data.integrations),
      },
      integrations: data.integrations,
      contacts: data.contacts,
      deals: data.deals,
      activity: data.activity,
    });
  }

  if (request.method === "GET" && url.pathname === "/api/settings/providers") {
    return json({
      appBaseUrl: appBaseUrl(request),
      credentials: credentialsSnapshot(data),
      whatsapp: {
        phoneNumberId: data.credentials.whatsapp.phoneNumberId || "",
        businessAccountId: data.credentials.whatsapp.businessAccountId || "",
        webhookUrl: `${appBaseUrl(request)}/api/webhooks/whatsapp`,
      },
      deploymentMode: "cloudflare-pages-demo",
    });
  }

  if (request.method === "POST" && url.pathname === "/api/settings/providers") {
    const body = await parseBody(request);
    const creds = body.credentials || {};

    if (creds.gmail) {
      data.credentials.gmail.clientId = String(creds.gmail.clientId || "").trim();
      if (typeof creds.gmail.clientSecret === "string" && creds.gmail.clientSecret.trim()) {
        data.credentials.gmail.clientSecret = creds.gmail.clientSecret.trim();
      }
    }

    if (creds.outlook) {
      data.credentials.outlook.clientId = String(creds.outlook.clientId || "").trim();
      data.credentials.outlook.tenantId = String(creds.outlook.tenantId || "common").trim() || "common";
      if (typeof creds.outlook.clientSecret === "string" && creds.outlook.clientSecret.trim()) {
        data.credentials.outlook.clientSecret = creds.outlook.clientSecret.trim();
      }
    }

    if (creds.linkedin) {
      data.credentials.linkedin.clientId = String(creds.linkedin.clientId || "").trim();
      data.credentials.linkedin.scope = String(creds.linkedin.scope || "").trim();
      if (typeof creds.linkedin.clientSecret === "string" && creds.linkedin.clientSecret.trim()) {
        data.credentials.linkedin.clientSecret = creds.linkedin.clientSecret.trim();
      }
    }

    if (creds.whatsapp) {
      data.credentials.whatsapp.phoneNumberId = String(creds.whatsapp.phoneNumberId || "").trim();
      data.credentials.whatsapp.businessAccountId = String(creds.whatsapp.businessAccountId || "").trim();
      if (typeof creds.whatsapp.accessToken === "string" && creds.whatsapp.accessToken.trim()) {
        data.credentials.whatsapp.accessToken = creds.whatsapp.accessToken.trim();
      }
      if (typeof creds.whatsapp.webhookVerifyToken === "string" && creds.whatsapp.webhookVerifyToken.trim()) {
        data.credentials.whatsapp.webhookVerifyToken = creds.whatsapp.webhookVerifyToken.trim();
      }
    }

    addActivity(data, "System", "Provider settings updated in Cloudflare Pages demo mode.");
    return json({ ok: true, credentials: credentialsSnapshot(data) });
  }

  if (request.method === "GET" && ["/api/auth/google/start", "/api/auth/microsoft/start", "/api/auth/linkedin/start"].includes(url.pathname)) {
    const provider = url.pathname.includes("google") ? "gmail" : url.pathname.includes("microsoft") ? "outlook" : "linkedin";
    return oauthUnsupportedRedirect(request, provider);
  }

  if (request.method === "GET" && ["/api/auth/google/url", "/api/auth/microsoft/url", "/api/auth/linkedin/url"].includes(url.pathname)) {
    const provider = url.pathname.includes("google") ? "gmail" : url.pathname.includes("microsoft") ? "outlook" : "linkedin";
    return json({
      provider,
      configured: false,
      message: `${providerLabel(provider)} OAuth is not enabled in the Pages demo deployment.`,
    });
  }

  if (request.method === "GET" && ["/api/auth/google/callback", "/api/auth/microsoft/callback", "/api/auth/linkedin/callback"].includes(url.pathname)) {
    const provider = url.pathname.includes("google") ? "gmail" : url.pathname.includes("microsoft") ? "outlook" : "linkedin";
    return oauthUnsupportedRedirect(request, provider);
  }

  if (request.method === "GET" && url.pathname === "/api/whatsapp/status") {
    return json({
      configured: Boolean(data.credentials.whatsapp.accessToken && data.credentials.whatsapp.phoneNumberId),
      phoneNumberId: data.credentials.whatsapp.phoneNumberId,
      businessAccountId: data.credentials.whatsapp.businessAccountId,
      hasWebhookVerifyToken: Boolean(data.credentials.whatsapp.webhookVerifyToken),
      webhookUrl: `${appBaseUrl(request)}/api/webhooks/whatsapp`,
    });
  }

  if (request.method === "GET" && url.pathname === "/api/webhooks/whatsapp") {
    const verifyToken = url.searchParams.get("hub.verify_token") || "";
    const mode = url.searchParams.get("hub.mode") || "";
    const challenge = url.searchParams.get("hub.challenge") || "";

    if (
      mode === "subscribe" &&
      data.credentials.whatsapp.webhookVerifyToken &&
      verifyToken === data.credentials.whatsapp.webhookVerifyToken
    ) {
      return new Response(challenge, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    return json({ error: "WhatsApp webhook verification failed." }, 403);
  }

  if (request.method === "POST" && url.pathname === "/api/webhooks/whatsapp") {
    const body = await parseBody(request);
    const messages = collectWhatsappMessages(body);

    data.integrations.whatsapp.connected = true;
    data.integrations.whatsapp.status = "Connected";
    data.integrations.whatsapp.account = data.credentials.whatsapp.businessAccountId || "whatsapp-business";
    data.integrations.whatsapp.lastSync = nowLabel();

    if (messages.length) {
      messages.forEach((message) => {
        const from = message.from || "unknown";
        const text = message.text?.body || `${message.type || "message"} received`;
        addActivity(data, "WhatsApp", `Inbound WhatsApp from ${from}: ${text}`);
      });
    } else {
      addActivity(data, "WhatsApp", "WhatsApp webhook event received.");
    }

    return json({ ok: true, received: messages.length || 0 });
  }

  if (request.method === "POST" && url.pathname === "/api/whatsapp/send") {
    return json({
      error: "Outbound WhatsApp sending is not enabled in the Pages demo deployment.",
    }, 501);
  }

  if (request.method === "POST" && url.pathname === "/api/integrations/connect") {
    const body = await parseBody(request);
    const provider = body.provider;
    const integration = data.integrations[provider];

    if (!integration) {
      return json({ error: "Unknown provider" }, 404);
    }

    if (provider !== "whatsapp") {
      return json({ error: `Use the local Node server for ${providerLabel(provider)} OAuth setup.` }, 400);
    }

    if (!data.credentials.whatsapp.accessToken || !data.credentials.whatsapp.phoneNumberId) {
      return json({ error: "Save the WhatsApp access token and phone number ID first." }, 400);
    }

    integration.connected = true;
    integration.status = "Connected";
    integration.account = data.credentials.whatsapp.businessAccountId || body.account || "whatsapp-business";
    integration.lastSync = nowLabel();
    addActivity(data, "WhatsApp", "WhatsApp channel connected in Cloudflare Pages demo mode.");
    return json({ ok: true, integration });
  }

  if (request.method === "POST" && url.pathname === "/api/integrations/disconnect") {
    const body = await parseBody(request);
    const provider = body.provider;
    const integration = data.integrations[provider];

    if (!integration) {
      return json({ error: "Unknown provider" }, 404);
    }

    integration.connected = false;
    integration.account = null;
    integration.lastSync = "Not synced yet";
    integration.status = resetStatus(provider);
    delete data.tokens[provider];
    delete data.authStates[provider];
    addActivity(data, "System", `${providerLabel(provider)} integration disconnected from CRM workspace.`);
    return json({ ok: true, integration });
  }

  if (request.method === "POST" && url.pathname === "/api/integrations/sync") {
    const body = await parseBody(request);
    const provider = body.provider;

    if (provider === "all") {
      Object.entries(data.integrations).forEach(([key, integration]) => {
        if (integration.connected) {
          integration.lastSync = nowLabel();
          addActivity(data, "System", `${providerLabel(key)} sync completed successfully.`);
        }
      });
      return json({ ok: true, data });
    }

    const integration = data.integrations[provider];
    if (!integration) {
      return json({ error: "Unknown provider" }, 404);
    }

    if (!integration.connected) {
      return json({ error: "Connect the provider before syncing" }, 400);
    }

    integration.lastSync = nowLabel();
    addActivity(data, "System", `${providerLabel(provider)} sync completed successfully.`);
    return json({ ok: true, integration });
  }

  return json({ error: "API route not found" }, 404);
}

async function serveAssets(request, env) {
  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  const url = new URL(request.url);
  if (url.pathname.includes(".")) {
    return assetResponse;
  }

  return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!ALLOWED_HOSTS.has(url.hostname)) {
      url.hostname = "ivbotpranavi.com";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (error) {
        return json({ error: error.message || "Unexpected error" }, 500);
      }
    }

    return serveAssets(request, env);
  },
};