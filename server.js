const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index < 1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "crm-data.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const defaultData = {
  integrations: {
    whatsapp: {
      connected: false,
      status: "Business API ready",
      scope: "Messages, templates, replies",
      lastSync: "Not synced yet",
      account: null
    },
    gmail: {
      connected: false,
      status: "OAuth ready",
      scope: "Email, meetings, tasks",
      lastSync: "Not synced yet",
      account: null
    },
    outlook: {
      connected: false,
      status: "OAuth ready",
      scope: "Email, calendar, directory",
      lastSync: "Not synced yet",
      account: null
    },
    linkedin: {
      connected: false,
      status: "OAuth ready",
      scope: "Login, profile, email",
      lastSync: "Not synced yet",
      account: null
    }
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
      lastActivity: "Replied to proposal thread"
    },
    {
      id: "contact_2",
      name: "Marcus Lee",
      company: "Northstar Health",
      title: "Operations Director",
      email: "marcus@northstarhealth.com",
      stage: "New lead",
      source: "LinkedIn",
      lastActivity: "Viewed profile and saved account"
    },
    {
      id: "contact_3",
      name: "Priya Raman",
      company: "Blue Orbit",
      title: "Founder",
      email: "priya@blueorbit.io",
      stage: "Proposal",
      source: "Outlook",
      lastActivity: "Booked follow-up meeting"
    },
    {
      id: "contact_4",
      name: "Diego Alvarez",
      company: "BrightPath Logistics",
      title: "Commercial Lead",
      email: "diego@brightpathlogistics.com",
      stage: "Qualified",
      source: "WhatsApp",
      lastActivity: "Sent pricing question over WhatsApp"
    }
  ],
  deals: [
    { id: "deal_1", name: "Acme Expansion", value: 42000, stage: "Proposal" },
    { id: "deal_2", name: "Northstar Pilot", value: 18000, stage: "Qualified" },
    { id: "deal_3", name: "Blue Orbit Retainer", value: 27000, stage: "Won" }
  ],
  activity: [
    {
      id: "act_1",
      source: "System",
      time: "09:14",
      message: "CRM workspace initialized and ready for channel connections."
    },
    {
      id: "act_2",
      source: "WhatsApp",
      time: "09:48",
      message: "WhatsApp Business channel added to the connection surface."
    },
    {
      id: "act_3",
      source: "Gmail",
      time: "10:02",
      message: "OAuth flow available when Google client credentials are configured."
    },
    {
      id: "act_4",
      source: "Outlook",
      time: "11:37",
      message: "Microsoft Graph sync can start after Azure app registration."
    }
  ],
  authStates: {},
  tokens: {},
  providerWorkspaces: {
    whatsapp: {
      accountLabel: "",
      conversations: []
    },
    gmail: {
      accountEmail: "",
      threads: [],
      meetings: []
    },
    outlook: {
      accountEmail: "",
      threads: [],
      meetings: []
    },
    linkedin: {
      profile: null
    }
  },
  credentials: {
    gmail: { clientId: "", clientSecret: "" },
    outlook: { clientId: "", clientSecret: "", tenantId: "common" },
    linkedin: { clientId: "", clientSecret: "", scope: "openid profile email" },
    whatsapp: { accessToken: "", phoneNumberId: "", businessAccountId: "", webhookVerifyToken: "" }
  }
};

function appBaseUrl() {
  return process.env.APP_BASE_URL || `http://localhost:${PORT}`;
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
}

function normalizeData(raw) {
  return {
    ...defaultData,
    ...raw,
    integrations: {
      ...defaultData.integrations,
      ...(raw.integrations || {})
    },
    contacts: Array.isArray(raw.contacts) ? raw.contacts : defaultData.contacts,
    deals: Array.isArray(raw.deals) ? raw.deals : defaultData.deals,
    activity: Array.isArray(raw.activity) ? raw.activity : defaultData.activity,
    authStates: raw.authStates || {},
    tokens: raw.tokens || {},
    providerWorkspaces: {
      ...defaultData.providerWorkspaces,
      ...(raw.providerWorkspaces || {}),
      whatsapp: {
        ...defaultData.providerWorkspaces.whatsapp,
        ...((raw.providerWorkspaces || {}).whatsapp || {}),
        conversations: Array.isArray((raw.providerWorkspaces || {}).whatsapp?.conversations)
          ? (raw.providerWorkspaces || {}).whatsapp.conversations
          : []
      },
      gmail: {
        ...defaultData.providerWorkspaces.gmail,
        ...((raw.providerWorkspaces || {}).gmail || {}),
        threads: Array.isArray((raw.providerWorkspaces || {}).gmail?.threads) ? (raw.providerWorkspaces || {}).gmail.threads : [],
        meetings: Array.isArray((raw.providerWorkspaces || {}).gmail?.meetings) ? (raw.providerWorkspaces || {}).gmail.meetings : []
      },
      outlook: {
        ...defaultData.providerWorkspaces.outlook,
        ...((raw.providerWorkspaces || {}).outlook || {}),
        threads: Array.isArray((raw.providerWorkspaces || {}).outlook?.threads) ? (raw.providerWorkspaces || {}).outlook.threads : [],
        meetings: Array.isArray((raw.providerWorkspaces || {}).outlook?.meetings) ? (raw.providerWorkspaces || {}).outlook.meetings : []
      },
      linkedin: {
        ...defaultData.providerWorkspaces.linkedin,
        ...((raw.providerWorkspaces || {}).linkedin || {})
      }
    },
    credentials: {
      ...defaultData.credentials,
      ...(raw.credentials || {}),
      gmail: { ...defaultData.credentials.gmail, ...((raw.credentials || {}).gmail || {}) },
      outlook: { ...defaultData.credentials.outlook, ...((raw.credentials || {}).outlook || {}) },
      linkedin: { ...defaultData.credentials.linkedin, ...((raw.credentials || {}).linkedin || {}) },
      whatsapp: { ...defaultData.credentials.whatsapp, ...((raw.credentials || {}).whatsapp || {}) }
    }
  };
}

function readData() {
  ensureDataFile();
  return normalizeData(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendRedirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "File not found" });
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1000000) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function nowLabel() {
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function addActivity(data, source, message) {
  data.activity.unshift({
    id: `act_${crypto.randomUUID()}`,
    source,
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    message
  });
  data.activity = data.activity.slice(0, 12);
}
function ensureProviderWorkspaces(data) {
  if (!data.providerWorkspaces) {
    data.providerWorkspaces = normalizeData({}).providerWorkspaces;
  }
  return data.providerWorkspaces;
}

function decodeGoogleHeader(value) {
  if (!value) return "";
  if (!/=\?UTF-8\?B\?/i.test(value)) return value;
  return value.replace(/=\?UTF-8\?B\?([^?]+)\?=/gi, (_, encoded) => {
    try {
      return Buffer.from(encoded, "base64").toString("utf8");
    } catch {
      return value;
    }
  });
}

function parseEmailIdentity(raw) {
  const value = String(raw || "").trim();
  const match = value.match(/^(.*?)(?:<([^>]+)>)?$/);
  const name = match?.[1]?.replace(/"/g, "").trim() || "";
  const email = match?.[2]?.trim() || (value.includes("@") ? value : "");
  return {
    name: name || email || "Unknown contact",
    email
  };
}

function stageFromProvider(provider) {
  if (provider === "whatsapp") return "Qualified";
  if (provider === "gmail") return "Qualified";
  if (provider === "outlook") return "Proposal";
  return "New lead";
}

function upsertContact(data, contact) {
  const source = contact.source || "CRM";
  const email = String(contact.email || "").trim().toLowerCase();
  const phone = String(contact.phone || "").trim();
  const existing = data.contacts.find((item) => {
    const itemEmail = String(item.email || "").trim().toLowerCase();
    return (email && itemEmail === email) || (phone && item.phone === phone) || (item.source === source && item.name === contact.name);
  });

  if (existing) {
    existing.name = contact.name || existing.name;
    existing.company = contact.company || existing.company || "";
    existing.title = contact.title || existing.title || "";
    existing.email = contact.email || existing.email || "";
    existing.phone = contact.phone || existing.phone || "";
    existing.stage = contact.stage || existing.stage || stageFromProvider(source.toLowerCase());
    existing.source = source;
    existing.lastActivity = contact.lastActivity || existing.lastActivity || "";
    return existing;
  }

  const created = {
    id: `contact_${crypto.randomUUID()}`,
    name: contact.name || "Unknown contact",
    company: contact.company || "",
    title: contact.title || "",
    email: contact.email || "",
    phone: contact.phone || "",
    stage: contact.stage || stageFromProvider(source.toLowerCase()),
    source,
    lastActivity: contact.lastActivity || ""
  };
  data.contacts.unshift(created);
  data.contacts = data.contacts.slice(0, 200);
  return created;
}

function upsertWhatsappConversation(data, phone, name) {
  const workspaces = ensureProviderWorkspaces(data);
  const normalizedPhone = String(phone || "").trim();
  const existing = workspaces.whatsapp.conversations.find((item) => item.phone === normalizedPhone);
  if (existing) {
    if (name) existing.name = name;
    return existing;
  }

  const conversation = {
    id: `wa_${crypto.randomUUID()}`,
    phone: normalizedPhone,
    name: name || normalizedPhone || "Unknown contact",
    lastMessage: "",
    updatedAt: new Date().toISOString(),
    messages: []
  };
  workspaces.whatsapp.conversations.unshift(conversation);
  return conversation;
}

function recordWhatsappMessage(data, payload) {
  const workspace = ensureProviderWorkspaces(data);
  workspace.whatsapp.accountLabel = data.credentials.whatsapp.businessAccountId || workspace.whatsapp.accountLabel || "whatsapp-business";
  const conversation = upsertWhatsappConversation(data, payload.phone, payload.name);
  const message = {
    id: payload.id || `wam_${crypto.randomUUID()}`,
    direction: payload.direction || "inbound",
    text: payload.text || "",
    timestamp: payload.timestamp || new Date().toISOString(),
    status: payload.status || "received"
  };
  conversation.messages.push(message);
  conversation.messages = conversation.messages.slice(-50);
  conversation.lastMessage = message.text || conversation.lastMessage;
  conversation.updatedAt = message.timestamp;
  workspace.whatsapp.conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  upsertContact(data, {
    name: conversation.name || conversation.phone,
    phone: conversation.phone,
    source: "WhatsApp",
    stage: "Qualified",
    lastActivity: message.text || "WhatsApp conversation updated"
  });
}

function isTokenExpired(tokenRecord) {
  if (!tokenRecord?.storedAt || !tokenRecord?.expires_in) return false;
  const expiresAt = new Date(tokenRecord.storedAt).getTime() + Number(tokenRecord.expires_in) * 1000;
  return Date.now() > expiresAt - 120000;
}

async function refreshGoogleTokens(tokenRecord) {
  const config = oauthConfig("gmail");
  if (!tokenRecord?.refresh_token) return tokenRecord;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: tokenRecord.refresh_token,
    grant_type: "refresh_token"
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${await response.text()}`);
  }
  const refreshed = await response.json();
  return {
    ...tokenRecord,
    ...refreshed,
    refresh_token: refreshed.refresh_token || tokenRecord.refresh_token,
    storedAt: new Date().toISOString()
  };
}

async function refreshMicrosoftTokens(tokenRecord) {
  const config = oauthConfig("outlook");
  if (!tokenRecord?.refresh_token) return tokenRecord;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: tokenRecord.refresh_token,
    grant_type: "refresh_token",
    scope: config.scope
  });
  const response = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) {
    throw new Error(`Microsoft token refresh failed: ${await response.text()}`);
  }
  const refreshed = await response.json();
  return {
    ...tokenRecord,
    ...refreshed,
    refresh_token: refreshed.refresh_token || tokenRecord.refresh_token,
    storedAt: new Date().toISOString()
  };
}

async function getAccessToken(data, provider) {
  const tokenRecord = data.tokens[provider];
  if (!tokenRecord?.access_token) {
    throw new Error(`Connect ${providerLabel(provider)} first so CRM can fetch live data.`);
  }
  if (!isTokenExpired(tokenRecord)) {
    return tokenRecord.access_token;
  }
  let refreshed = tokenRecord;
  if (provider === "gmail") refreshed = await refreshGoogleTokens(tokenRecord);
  if (provider === "outlook") refreshed = await refreshMicrosoftTokens(tokenRecord);
  data.tokens[provider] = refreshed;
  writeData(data);
  return refreshed.access_token;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error_description || payload?.message || `Request failed with ${response.status}`);
  }
  return payload;
}

async function fetchGoogleWorkspace(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [profile, messagesList, calendarFeed] = await Promise.all([
    fetchJson("https://www.googleapis.com/gmail/v1/users/me/profile", { headers }),
    fetchJson("https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=8", { headers }),
    fetchJson(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(new Date().toISOString())}&maxResults=4`, { headers })
  ]);
  const messageIds = (messagesList.messages || []).map((item) => item.id).slice(0, 8);
  const details = await Promise.all(messageIds.map((id) => fetchJson(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers })));
  return {
    accountEmail: profile.emailAddress || "",
    threads: details.map((message) => {
      const headersMap = Object.fromEntries((message.payload?.headers || []).map((header) => [header.name, header.value]));
      const identity = parseEmailIdentity(decodeGoogleHeader(headersMap.From || ""));
      return {
        id: message.id,
        subject: decodeGoogleHeader(headersMap.Subject || "(no subject)"),
        fromName: identity.name,
        fromEmail: identity.email,
        snippet: message.snippet || "",
        receivedAt: headersMap.Date || "",
        provider: "gmail"
      };
    }),
    meetings: (calendarFeed.items || []).map((item) => ({
      id: item.id,
      title: item.summary || "Untitled meeting",
      start: item.start?.dateTime || item.start?.date || "",
      location: item.location || ""
    }))
  };
}

async function fetchOutlookWorkspace(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [profile, messagesFeed, eventsFeed] = await Promise.all([
    fetchJson("https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName", { headers }),
    fetchJson("https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=8&$select=id,subject,from,receivedDateTime,bodyPreview", { headers }),
    fetchJson("https://graph.microsoft.com/v1.0/me/events?$top=4&$select=id,subject,start,location&$orderby=start/dateTime", { headers })
  ]);
  return {
    accountEmail: profile.mail || profile.userPrincipalName || "",
    threads: (messagesFeed.value || []).map((message) => ({
      id: message.id,
      subject: message.subject || "(no subject)",
      fromName: message.from?.emailAddress?.name || message.from?.emailAddress?.address || "Unknown sender",
      fromEmail: message.from?.emailAddress?.address || "",
      snippet: message.bodyPreview || "",
      receivedAt: message.receivedDateTime || "",
      provider: "outlook"
    })),
    meetings: (eventsFeed.value || []).map((item) => ({
      id: item.id,
      title: item.subject || "Untitled event",
      start: item.start?.dateTime || "",
      location: item.location?.displayName || ""
    }))
  };
}

function syncContactsFromWorkspace(data, provider, workspace) {
  if (provider === "gmail" || provider === "outlook") {
    workspace.threads.forEach((thread) => {
      upsertContact(data, {
        name: thread.fromName || thread.fromEmail || "Unknown sender",
        email: thread.fromEmail || "",
        source: provider === "gmail" ? "Gmail" : "Outlook",
        stage: stageFromProvider(provider),
        lastActivity: thread.subject || thread.snippet || "Mailbox thread synced"
      });
    });
  }
}
function providerLabel(provider) {
  if (provider === "gmail") return "Gmail";
  if (provider === "outlook") return "Outlook";
  if (provider === "linkedin") return "LinkedIn";
  return "WhatsApp";
}

function resetStatus(provider) {
  if (provider === "whatsapp") return "Business API ready";
  return "OAuth ready";
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
      hasClientSecret: Boolean(data.credentials.gmail.clientSecret)
    },
    outlook: {
      clientId: data.credentials.outlook.clientId,
      hasClientSecret: Boolean(data.credentials.outlook.clientSecret),
      tenantId: data.credentials.outlook.tenantId || "common"
    },
    linkedin: {
      clientId: data.credentials.linkedin.clientId,
      hasClientSecret: Boolean(data.credentials.linkedin.clientSecret),
      scope: data.credentials.linkedin.scope || ""
    },
    whatsapp: {
      hasAccessToken: Boolean(data.credentials.whatsapp.accessToken),
      phoneNumberId: data.credentials.whatsapp.phoneNumberId || "",
      businessAccountId: data.credentials.whatsapp.businessAccountId || "",
      hasWebhookVerifyToken: Boolean(data.credentials.whatsapp.webhookVerifyToken)
    }
  };
}

function oauthConfig(provider) {
  const base = appBaseUrl();
  const data = readData();
  const saved = data.credentials || {};

  if (provider === "gmail") {
    return {
      clientId: saved.gmail?.clientId || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: saved.gmail?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: `${base}/api/auth/google/callback`,
      scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly"
    };
  }

  if (provider === "outlook") {
    return {
      clientId: saved.outlook?.clientId || process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: saved.outlook?.clientSecret || process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: saved.outlook?.tenantId || process.env.MICROSOFT_TENANT_ID || "common",
      redirectUri: `${base}/api/auth/microsoft/callback`,
      scope: "openid profile email offline_access User.Read Mail.Read Calendars.Read"
    };
  }

  if (provider === "linkedin") {
    return {
      clientId: saved.linkedin?.clientId || process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: saved.linkedin?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || "",
      redirectUri: `${base}/api/auth/linkedin/callback`,
      scope: saved.linkedin?.scope || process.env.LINKEDIN_SCOPE || ""
    };
  }

  return null;
}

function configError(provider) {
  const config = oauthConfig(provider);
  if (!config) return "Unknown provider.";
  if (!config.clientId || !config.clientSecret) {
    return `Save the ${providerLabel(provider)} client ID and client secret in CRM settings first.`;
  }
  if (provider === "linkedin" && !config.scope) {
    return "Save LINKEDIN_SCOPE in CRM settings to exactly match the scopes enabled for your LinkedIn app.";
  }
  return null;
}
function whatsappConfig() {
  const data = readData();
  const saved = data.credentials.whatsapp || {};
  return {
    accessToken: saved.accessToken || "",
    phoneNumberId: saved.phoneNumberId || "",
    businessAccountId: saved.businessAccountId || "",
    webhookVerifyToken: saved.webhookVerifyToken || "",
    apiVersion: "v23.0"
  };
}

function whatsappConfigError() {
  const config = whatsappConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    return "Save the WhatsApp access token and phone number ID in CRM settings first.";
  }
  return null;
}

async function sendWhatsAppMessage(to, text) {
  const config = whatsappConfig();
  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "WhatsApp send failed.");
  }

  return payload;
}

function collectWhatsappMessages(payload) {
  const changes = payload?.entry?.flatMap((entry) => entry?.changes || []) || [];
  const values = changes.map((change) => change?.value).filter(Boolean);
  return values.flatMap((value) => value?.messages || []).map((message) => {
    const contacts = values.flatMap((value) => value?.contacts || []);
    const matchingContact = contacts.find((item) => item.wa_id === message.from);
    return {
      id: message.id,
      from: message.from || "unknown",
      name: matchingContact?.profile?.name || message.from || "Unknown contact",
      text: message.text?.body || `${message.type || "message"} received`,
      timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
      type: message.type || "text"
    };
  });
}

function createState() {
  return crypto.randomBytes(24).toString("hex");
}

function authStartUrl(provider, state) {
  const config = oauthConfig(provider);

  if (provider === "gmail") {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope: config.scope,
      state
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === "outlook") {
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: "code",
      redirect_uri: config.redirectUri,
      response_mode: "query",
      scope: config.scope,
      state
    });
    return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: config.scope
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

async function exchangeGoogleCode(code) {
  const config = oauthConfig("gmail");
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }

  return response.json();
}

async function exchangeMicrosoftCode(code) {
  const config = oauthConfig("outlook");
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    scope: config.scope
  });

  const response = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Microsoft token exchange failed: ${await response.text()}`);
  }

  return response.json();
}

async function exchangeLinkedInCode(code) {
  const config = oauthConfig("linkedin");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri
  });

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed: ${await response.text()}`);
  }

  return response.json();
}

async function fetchGoogleAccount(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return "google-account";
  }

  const profile = await response.json();
  return profile.email || profile.name || "google-account";
}

async function fetchMicrosoftAccount(accessToken) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return "microsoft-account";
  }

  const profile = await response.json();
  return profile.mail || profile.userPrincipalName || profile.displayName || "microsoft-account";
}

async function resolveAccount(provider, tokens) {
  if (provider === "gmail") return fetchGoogleAccount(tokens.access_token);
  if (provider === "outlook") return fetchMicrosoftAccount(tokens.access_token);
  if (provider === "linkedin") return "linkedin-member";
  return "whatsapp-business";
}
async function completeOAuth(provider, url, res) {
  const error = url.searchParams.get("error");
  if (error) {
    sendRedirect(res, `/?error=${encodeURIComponent(`${providerLabel(provider)} login failed: ${error}`)}`);
    return;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const data = readData();

  if (!code || !state || data.authStates[provider] !== state) {
    sendRedirect(res, `/?error=${encodeURIComponent(`Invalid ${providerLabel(provider)} OAuth state or code.`)}`);
    return;
  }

  delete data.authStates[provider];

  let tokens;
  if (provider === "gmail") tokens = await exchangeGoogleCode(code);
  if (provider === "outlook") tokens = await exchangeMicrosoftCode(code);
  if (provider === "linkedin") tokens = await exchangeLinkedInCode(code);

  const account = await resolveAccount(provider, tokens);
  data.tokens[provider] = {
    ...tokens,
    storedAt: new Date().toISOString()
  };
  data.integrations[provider].connected = true;
  data.integrations[provider].status = "Connected";
  data.integrations[provider].account = account;
  data.integrations[provider].lastSync = nowLabel();
  ensureProviderWorkspaces(data);
  if (provider === "gmail") data.providerWorkspaces.gmail.accountEmail = account;
  if (provider === "outlook") data.providerWorkspaces.outlook.accountEmail = account;
  addActivity(data, providerLabel(provider), `${providerLabel(provider)} login completed successfully.`);
  writeData(data);

  sendRedirect(res, `/?connected=${encodeURIComponent(providerLabel(provider))}`);
}

async function syncProviderWorkspace(data, provider) {
  if (provider === "gmail") {
    const accessToken = await getAccessToken(data, "gmail");
    const workspace = await fetchGoogleWorkspace(accessToken);
    data.providerWorkspaces.gmail = workspace;
    data.integrations.gmail.connected = true;
    data.integrations.gmail.status = "Connected";
    data.integrations.gmail.account = workspace.accountEmail || data.integrations.gmail.account;
    data.integrations.gmail.lastSync = nowLabel();
    syncContactsFromWorkspace(data, "gmail", workspace);
    addActivity(data, "Gmail", `Gmail synced ${workspace.threads.length} inbox thread(s) and ${workspace.meetings.length} calendar item(s).`);
    return workspace;
  }

  if (provider === "outlook") {
    const accessToken = await getAccessToken(data, "outlook");
    const workspace = await fetchOutlookWorkspace(accessToken);
    data.providerWorkspaces.outlook = workspace;
    data.integrations.outlook.connected = true;
    data.integrations.outlook.status = "Connected";
    data.integrations.outlook.account = workspace.accountEmail || data.integrations.outlook.account;
    data.integrations.outlook.lastSync = nowLabel();
    syncContactsFromWorkspace(data, "outlook", workspace);
    addActivity(data, "Outlook", `Outlook synced ${workspace.threads.length} inbox thread(s) and ${workspace.meetings.length} calendar item(s).`);
    return workspace;
  }

  if (provider === "whatsapp") {
    data.integrations.whatsapp.connected = true;
    data.integrations.whatsapp.status = "Connected";
    data.integrations.whatsapp.account = data.credentials.whatsapp.businessAccountId || data.integrations.whatsapp.account || "whatsapp-business";
    data.integrations.whatsapp.lastSync = nowLabel();
    ensureProviderWorkspaces(data).whatsapp.accountLabel = data.integrations.whatsapp.account || "whatsapp-business";
    addActivity(data, "WhatsApp", "WhatsApp workspace refreshed from stored conversation data.");
    return data.providerWorkspaces.whatsapp;
  }

  throw new Error(`${providerLabel(provider)} does not support a CRM-native live workspace in this build.`);
}

function routeApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, timestamp: new Date().toISOString() });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/dashboard") {
    const data = readData();
    sendJson(res, 200, {
      summary: {
        connectedChannels: Object.values(data.integrations).filter((integration) => integration.connected).length,
        contactsCaptured: data.contacts.length,
        openOpportunities: data.deals.filter((deal) => deal.stage !== "Won").length,
        lastSync: summariseLastSync(data.integrations)
      },
      integrations: data.integrations,
      contacts: data.contacts,
      deals: data.deals,
      activity: data.activity,
      providerWorkspaces: data.providerWorkspaces
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/settings/providers") {
    const data = readData();
    sendJson(res, 200, {
      appBaseUrl: appBaseUrl(),
      credentials: credentialsSnapshot(data),
      whatsapp: {
        webhookUrl: `${appBaseUrl()}/api/webhooks/whatsapp`
      }
    });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/settings/providers") {
    parseBody(req)
      .then((body) => {
        const data = readData();
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

        writeData(data);
        sendJson(res, 200, {
          ok: true,
          credentials: credentialsSnapshot(data)
        });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/google/start") {
    const error = configError("gmail");
    if (error) {
      sendRedirect(res, `/?error=${encodeURIComponent(error)}`);
      return true;
    }
    const data = readData();
    const state = createState();
    data.authStates.gmail = state;
    writeData(data);
    sendRedirect(res, authStartUrl("gmail", state));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/microsoft/start") {
    const error = configError("outlook");
    if (error) {
      sendRedirect(res, `/?error=${encodeURIComponent(error)}`);
      return true;
    }
    const data = readData();
    const state = createState();
    data.authStates.outlook = state;
    writeData(data);
    sendRedirect(res, authStartUrl("outlook", state));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/linkedin/start") {
    const error = configError("linkedin");
    if (error) {
      sendRedirect(res, `/?error=${encodeURIComponent(error)}`);
      return true;
    }
    const data = readData();
    const state = createState();
    data.authStates.linkedin = state;
    writeData(data);
    sendRedirect(res, authStartUrl("linkedin", state));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/google/url") {
    const error = configError("gmail");
    sendJson(res, 200, {
      provider: "gmail",
      configured: !error,
      startPath: "/api/auth/google/start",
      message: error || "Google OAuth is configured. Click Connect to continue."
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/microsoft/url") {
    const error = configError("outlook");
    sendJson(res, 200, {
      provider: "outlook",
      configured: !error,
      startPath: "/api/auth/microsoft/start",
      message: error || "Microsoft OAuth is configured. Click Connect to continue."
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/linkedin/url") {
    const error = configError("linkedin");
    sendJson(res, 200, {
      provider: "linkedin",
      configured: !error,
      startPath: "/api/auth/linkedin/start",
      message: error || "LinkedIn OAuth is configured. Click Connect to continue."
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/google/callback") {
    completeOAuth("gmail", url, res).catch((oauthError) => {
      sendRedirect(res, `/?error=${encodeURIComponent(oauthError.message)}`);
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/microsoft/callback") {
    completeOAuth("outlook", url, res).catch((oauthError) => {
      sendRedirect(res, `/?error=${encodeURIComponent(oauthError.message)}`);
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/linkedin/callback") {
    completeOAuth("linkedin", url, res).catch((oauthError) => {
      sendRedirect(res, `/?error=${encodeURIComponent(oauthError.message)}`);
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/whatsapp/status") {
    const config = whatsappConfig();
    sendJson(res, 200, {
      configured: Boolean(config.accessToken && config.phoneNumberId),
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      hasWebhookVerifyToken: Boolean(config.webhookVerifyToken),
      webhookUrl: `${appBaseUrl()}/api/webhooks/whatsapp`
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/webhooks/whatsapp") {
    const verifyToken = url.searchParams.get("hub.verify_token") || "";
    const mode = url.searchParams.get("hub.mode") || "";
    const challenge = url.searchParams.get("hub.challenge") || "";
    const config = whatsappConfig();

    if (mode === "subscribe" && config.webhookVerifyToken && verifyToken === config.webhookVerifyToken) {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(challenge);
      return true;
    }

    sendJson(res, 403, { error: "WhatsApp webhook verification failed." });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/whatsapp") {
    parseBody(req)
      .then((body) => {
        const data = readData();
        const messages = collectWhatsappMessages(body);

        data.integrations.whatsapp.connected = true;
        data.integrations.whatsapp.status = "Connected";
        data.integrations.whatsapp.account = data.credentials.whatsapp.businessAccountId || "whatsapp-business";
        data.integrations.whatsapp.lastSync = nowLabel();

        if (messages.length) {
          messages.forEach((message) => {
            recordWhatsappMessage(data, {
              id: message.id,
              phone: message.from,
              name: message.name,
              text: message.text,
              timestamp: message.timestamp,
              direction: "inbound",
              status: "received"
            });
            addActivity(data, "WhatsApp", `Inbound WhatsApp from ${message.name || message.from}: ${message.text}`);
          });
        } else {
          addActivity(data, "WhatsApp", "WhatsApp webhook event received.");
        }

        writeData(data);
        sendJson(res, 200, { ok: true, received: messages.length || 0 });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/whatsapp/send") {
    parseBody(req)
      .then(async (body) => {
        const error = whatsappConfigError();
        if (error) {
          sendJson(res, 400, { error });
          return;
        }

        const to = String(body.to || "").trim();
        const text = String(body.text || "").trim();
        const name = String(body.name || to).trim();
        if (!to || !text) {
          sendJson(res, 400, { error: "Provide both a destination WhatsApp number and a message." });
          return;
        }

        const result = await sendWhatsAppMessage(to, text);
        const data = readData();
        data.integrations.whatsapp.connected = true;
        data.integrations.whatsapp.status = "Connected";
        data.integrations.whatsapp.account = data.credentials.whatsapp.businessAccountId || "whatsapp-business";
        data.integrations.whatsapp.lastSync = nowLabel();
        recordWhatsappMessage(data, {
          phone: to,
          name,
          text,
          direction: "outbound",
          status: "sent"
        });
        addActivity(data, "WhatsApp", `Outbound WhatsApp sent to ${to}.`);
        writeData(data);

        sendJson(res, 200, { ok: true, result });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }
  if (req.method === "POST" && url.pathname === "/api/integrations/connect") {
    parseBody(req)
      .then((body) => {
        const provider = body.provider;
        const data = readData();
        const integration = data.integrations[provider];

        if (!integration) {
          sendJson(res, 404, { error: "Unknown provider" });
          return;
        }

        if (provider !== "whatsapp") {
          sendJson(res, 400, { error: `Use OAuth login to connect ${providerLabel(provider)}.` });
          return;
        }

        const error = whatsappConfigError();
        if (error) {
          sendJson(res, 400, { error });
          return;
        }

        integration.connected = true;
        integration.status = "Connected";
        integration.account = data.credentials.whatsapp.businessAccountId || body.account || "whatsapp-business";
        integration.lastSync = nowLabel();
        ensureProviderWorkspaces(data).whatsapp.accountLabel = integration.account;
        addActivity(data, "WhatsApp", "WhatsApp channel connected and ready for sync.");
        writeData(data);
        sendJson(res, 200, { ok: true, integration });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/integrations/disconnect") {
    parseBody(req)
      .then((body) => {
        const provider = body.provider;
        const data = readData();
        const integration = data.integrations[provider];

        if (!integration) {
          sendJson(res, 404, { error: "Unknown provider" });
          return;
        }

        integration.connected = false;
        integration.account = null;
        integration.lastSync = "Not synced yet";
        integration.status = resetStatus(provider);
        delete data.tokens[provider];
        delete data.authStates[provider];
        if (provider === "gmail") data.providerWorkspaces.gmail = defaultData.providerWorkspaces.gmail;
        if (provider === "outlook") data.providerWorkspaces.outlook = defaultData.providerWorkspaces.outlook;
        if (provider === "linkedin") data.providerWorkspaces.linkedin = defaultData.providerWorkspaces.linkedin;
        if (provider === "whatsapp") data.providerWorkspaces.whatsapp.accountLabel = "";
        addActivity(data, "System", `${providerLabel(provider)} integration disconnected from CRM workspace.`);
        writeData(data);
        sendJson(res, 200, { ok: true, integration });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/integrations/sync") {
    parseBody(req)
      .then(async (body) => {
        const provider = body.provider;
        const data = readData();

        if (provider === "all") {
          const providers = Object.keys(data.integrations).filter((key) => key !== "linkedin");
          const results = {};
          for (const key of providers) {
            if (!data.integrations[key].connected) continue;
            results[key] = await syncProviderWorkspace(data, key);
          }
          writeData(data);
          sendJson(res, 200, { ok: true, results, data });
          return;
        }

        const integration = data.integrations[provider];
        if (!integration) {
          sendJson(res, 404, { error: "Unknown provider" });
          return;
        }

        if (!integration.connected) {
          sendJson(res, 400, { error: "Connect the provider before syncing" });
          return;
        }

        const result = await syncProviderWorkspace(data, provider);
        writeData(data);
        sendJson(res, 200, { ok: true, integration: data.integrations[provider], workspace: result });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  return false;
}

function routeStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  sendFile(res, filePath);
}

ensureDataFile();

const server = http.createServer((req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  if (url.pathname.startsWith("/api/")) {
    const handled = routeApi(req, res, url);
    if (!handled) {
      sendJson(res, 404, { error: "API route not found" });
    }
    return;
  }

  routeStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`Pranavi CRM running at http://localhost:${PORT}`);
});






