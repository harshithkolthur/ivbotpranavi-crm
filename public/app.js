const state = {
  dashboard: null,
  settings: null,
  activeView: "overview",
  activeContactsChannel: "all",
  query: "",
};

const viewMeta = {
  overview: {
    title: "Overview",
    subtitle: "Plan next actions, review task activity, and manage assignment ownership from one overview.",
  },
  pipeline: {
    title: "Sales Pipeline",
    subtitle: "Stage-aware deal tracking using the stitched kanban interface patterns.",
  },
  contacts: {
    title: "Contacts",
    subtitle: "Review contact records by channel, including WhatsApp, Google Workspace, Outlook, and LinkedIn.",
  },
  extraction: {
    title: "Lead Extraction",
    subtitle: "Prospecting UI adapted from the stitched frontend and ready for backend hookup.",
  },
  integrations: {
    title: "Integrations",
    subtitle: "Manage WhatsApp, Gmail, Outlook, and LinkedIn connections from one surface.",
  },
  settings: {
    title: "Provider Settings",
    subtitle: "Save OAuth and WhatsApp credentials so the live connectors can run end to end.",
  },
};

const integrationConfig = {
  whatsapp: {
    label: "WhatsApp Business",
    subtitle: "Messaging, inbound sync, and webhook events",
    icon: "chat",
    accent: "#25D366",
    soft: "#dcfce7",
  },
  gmail: {
    label: "Google Workspace",
    subtitle: "Email and calendar sync",
    icon: "mail",
    accent: "#EA4335",
    soft: "#fee2e2",
  },
  outlook: {
    label: "Microsoft Outlook",
    subtitle: "Office 365 and Microsoft Graph",
    icon: "forward_to_inbox",
    accent: "#0078D4",
    soft: "#dbeafe",
  },
  linkedin: {
    label: "LinkedIn",
    subtitle: "Profile, account, and outreach context",
    icon: "work",
    accent: "#0A66C2",
    soft: "#dbeafe",
  },
};

const pipelineStages = [
  { key: "New lead", title: "New Leads", color: "#091426" },
  { key: "Qualified", title: "Qualified", color: "#545f73" },
  { key: "Proposal", title: "Proposal", color: "#9a3412" },
  { key: "Won", title: "Won", color: "#166534" },
];

const LEAD_WORKFLOW_STORAGE_KEY = "pranavi-crm-lead-workflow";
const SAFE_LEAD_POOL = [
  {
    name: "Anika Rao",
    company: "OrbitIQ",
    title: "Founder & CEO",
    region: "India",
    email: "anika@orbitiq.ai",
    mobile: "+91-90000-11111",
    linkedinUrl: "https://linkedin.com/in/anika-rao",
    headline: "Building AI workflow tooling for revenue teams",
  },
  {
    name: "Jordan Mills",
    company: "Northstar Grid",
    title: "CEO",
    region: "North America",
    email: "jordan@northstargrid.com",
    mobile: "+1-415-555-0184",
    linkedinUrl: "https://linkedin.com/in/jordanmills",
    headline: "Scaling grid analytics and distributed operations",
  },
  {
    name: "Marta Klein",
    company: "BluePeak Labs",
    title: "Head of Sales",
    region: "Europe",
    email: "marta@bluepeaklabs.eu",
    mobile: "+49-151-2003004",
    linkedinUrl: "https://linkedin.com/in/martaklein",
    headline: "GTM leader focused on enterprise expansion",
  },
  {
    name: "Rohan Mehta",
    company: "FieldBloom",
    title: "Founder",
    region: "India",
    email: "rohan@fieldbloom.io",
    mobile: "+91-98888-22222",
    linkedinUrl: "https://linkedin.com/in/rohanmehta",
    headline: "Founder helping ops teams orchestrate field workflows",
  },
  {
    name: "Layla Hassan",
    company: "SignalForge",
    title: "COO",
    region: "Middle East",
    email: "layla@signalforge.io",
    mobile: "+971-55-400-1122",
    linkedinUrl: "https://linkedin.com/in/laylahassan",
    headline: "Operator building regional demand and delivery systems",
  },
];

function $(id) {
  return document.getElementById(id);
}

function showAlert(message, tone = "info") {
  const alert = $("alert");
  const styles = {
    info: ["border-info", "bg-info-soft", "text-info"],
    success: ["border-success", "bg-success-soft", "text-success"],
    error: ["border-danger", "bg-danger-soft", "text-danger"],
  };

  alert.className = "mb-6 rounded-2xl border px-4 py-3 text-sm shadow-panel";
  styles[tone].forEach((token) => alert.classList.add(token));
  alert.textContent = message;
  alert.classList.remove("hidden");
}

function clearAlert() {
  $("alert").classList.add("hidden");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && payload.error
        ? payload.error
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getConnectedCount(integrations) {
  return Object.values(integrations).filter((item) => item.connected).length;
}

function getReadinessText(count) {
  if (count === 0) return "Waiting for first integrations.";
  if (count === 1) return "Foundation started with one live channel.";
  if (count < 4) return "Strong progress. Add the remaining channels for full visibility.";
  return "All core channels are connected and ready.";
}

function getHeroStatus(count) {
  if (count === 0) return "Needs setup";
  if (count < 3) return "Partial live sync";
  return "Multi-channel ready";
}

const contactsChannelConfig = [
  {
    key: "all",
    label: "All contacts",
    description: "Cross-channel view across every provider feeding the CRM.",
    sources: null,
    launchUrl: null,
    launchLabel: null,
    embedUrl: null,
    embedSupport: "native",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Conversations, inbound replies, and business messaging contacts.",
    sources: ["WhatsApp"],
    launchUrl: "https://web.whatsapp.com/",
    launchLabel: "WhatsApp Web",
    embedUrl: "https://web.whatsapp.com/",
    embedSupport: "restricted",
  },
  {
    key: "gmail",
    label: "Google Workspace",
    description: "Email and calendar contacts synced from Google Workspace.",
    sources: ["Gmail", "Google Workspace"],
    launchUrl: "https://mail.google.com/",
    launchLabel: "Google Workspace",
    embedUrl: "https://mail.google.com/",
    embedSupport: "restricted",
  },
  {
    key: "outlook",
    label: "Microsoft Outlook",
    description: "Office 365 and Microsoft Graph contacts and thread context.",
    sources: ["Outlook", "Microsoft Outlook"],
    launchUrl: "https://outlook.office.com/mail/",
    launchLabel: "Microsoft Outlook",
    embedUrl: "https://outlook.office.com/mail/",
    embedSupport: "restricted",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    description: "Profiles, saved leads, and outreach-ready LinkedIn relationships.",
    sources: ["LinkedIn"],
    launchUrl: "https://www.linkedin.com/feed/",
    launchLabel: "LinkedIn",
    embedUrl: "https://www.linkedin.com/feed/",
    embedSupport: "restricted",
  },
];

function getContactsChannel() {
  return contactsChannelConfig.find((channel) => channel.key === state.activeContactsChannel) || contactsChannelConfig[0];
}

function getContactsForChannel(channel) {
  const contacts = state.dashboard?.contacts || [];
  if (!channel?.sources) return contacts;
  return contacts.filter((contact) => channel.sources.includes(contact.source));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatWorkspaceTime(value) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getProviderWorkspace(channelKey) {
  return state.dashboard?.providerWorkspaces?.[channelKey] || null;
}

function buildChannelWorkspace(channel, contacts) {
  const primaryContact = contacts[0];
  const workspace = getProviderWorkspace(channel.key);
  const recentActivity = primaryContact?.lastActivity || "No recent activity yet.";
  const accountLabel = primaryContact?.company || channel.label;
  const contactName = primaryContact?.name || "No contact selected";
  const contactTitle = primaryContact?.title || "Waiting for synced records";

  if (channel.key === "whatsapp") {
    const conversations = workspace?.conversations || [];
    const activeConversation = conversations[0];
    const messages = activeConversation?.messages || [];
    return {
      badge: "WhatsApp live workspace",
      title: "WhatsApp CRM inbox",
      description: conversations.length
        ? "This panel is fed by your real WhatsApp webhook and outbound API activity."
        : "Connect WhatsApp and send or receive messages to populate this CRM-native inbox.",
      content: `
        <div class="crm-provider crm-provider-whatsapp">
          <aside class="crm-provider-sidebar">
            <div class="crm-provider-sidebar-header">
              <p class="summary-label">Conversations</p>
              <strong>${conversations.length}</strong>
            </div>
            ${conversations.length
              ? conversations
                  .map((conversation) => `
                    <article class="crm-provider-list-item ${activeConversation?.id === conversation.id ? "active" : ""}">
                      <span class="avatar">${escapeHtml(initials(conversation.name || conversation.phone))}</span>
                      <div>
                        <p class="crm-provider-list-title">${escapeHtml(conversation.name || conversation.phone)}</p>
                        <p class="crm-provider-list-copy">${escapeHtml(conversation.lastMessage || "No message yet")}</p>
                      </div>
                    </article>
                  `)
                  .join("")
              : '<article class="crm-provider-stat-card"><p class="summary-meta">No live WhatsApp conversations captured yet.</p></article>'}
          </aside>
          <section class="crm-provider-main">
            <div class="crm-provider-thread-header">
              <div>
                <p class="crm-provider-thread-title">${escapeHtml(activeConversation?.name || contactName)}</p>
                <p class="crm-provider-thread-copy">${escapeHtml(activeConversation?.phone || contactTitle)}</p>
              </div>
              <span class="tracker-pill">API live</span>
            </div>
            <div class="crm-provider-thread-body">
              ${messages.length
                ? messages
                    .map((message) => `
                      <div class="crm-chat-bubble ${message.direction === "outbound" ? "outbound" : "inbound"}">
                        <strong class="crm-message-meta">${message.direction === "outbound" ? "You" : escapeHtml(activeConversation?.name || "Contact")}</strong>
                        <div>${escapeHtml(message.text)}</div>
                        <small class="crm-message-time">${escapeHtml(formatWorkspaceTime(message.timestamp))}</small>
                      </div>
                    `)
                    .join("")
                : `<div class="crm-chat-bubble inbound">${escapeHtml(recentActivity)}</div>`}
            </div>
            <div class="crm-provider-compose">
              <input id="whatsapp-compose-input" class="crm-provider-input" type="text" placeholder="Type a real WhatsApp reply from CRM" />
              <button class="action-btn primary" type="button" data-action="send-whatsapp" data-phone="${escapeHtml(activeConversation?.phone || primaryContact?.phone || "")}" data-name="${escapeHtml(activeConversation?.name || contactName)}">Send message</button>
            </div>
          </section>
        </div>
      `,
    };
  }

  if (channel.key === "gmail") {
    const threads = workspace?.threads || [];
    const meetings = workspace?.meetings || [];
    const activeThread = threads[0];
    return {
      badge: "Google Workspace live sync",
      title: "Gmail inbox inside CRM",
      description: threads.length
        ? "These threads and meetings are pulled from Google APIs after OAuth and sync."
        : "Connect and sync Gmail to load real inbox and calendar context here.",
      content: `
        <div class="crm-provider crm-provider-mail">
          <aside class="crm-provider-sidebar compact">
            <article class="crm-provider-stat-card">
              <p class="summary-label">Inbox threads</p>
              <strong>${threads.length}</strong>
              <p class="summary-meta">Account: ${escapeHtml(workspace?.accountEmail || state.dashboard?.integrations?.gmail?.account || "Not connected")}</p>
            </article>
            <article class="crm-provider-stat-card">
              <p class="summary-label">Upcoming meetings</p>
              <strong>${meetings.length}</strong>
              <p class="summary-meta">${meetings[0] ? escapeHtml(meetings[0].title) : "No upcoming meetings synced yet."}</p>
            </article>
          </aside>
          <section class="crm-provider-main">
            <div class="crm-provider-thread-header">
              <div>
                <p class="crm-provider-thread-title">${escapeHtml(activeThread?.subject || "Live Gmail inbox")}</p>
                <p class="crm-provider-thread-copy">${escapeHtml(activeThread?.fromEmail || workspace?.accountEmail || "Connect Gmail to load messages")}</p>
              </div>
              <span class="tracker-pill">API live</span>
            </div>
            <div class="crm-mail-list">
              ${threads.length
                ? threads
                    .map((thread) => `
                      <article class="crm-mail-row">
                        <div>
                          <p class="crm-provider-list-title">${escapeHtml(thread.subject || "(no subject)")}</p>
                          <p class="crm-provider-list-copy">${escapeHtml(thread.fromName || thread.fromEmail || "Unknown sender")}</p>
                        </div>
                        <p class="crm-provider-list-copy">${escapeHtml(thread.snippet || formatWorkspaceTime(thread.receivedAt))}</p>
                      </article>
                    `)
                    .join("")
                : '<article class="crm-provider-stat-card"><p class="summary-meta">No Gmail threads have been synced yet.</p></article>'}
            </div>
          </section>
        </div>
      `,
    };
  }

  if (channel.key === "outlook") {
    const threads = workspace?.threads || [];
    const meetings = workspace?.meetings || [];
    const activeThread = threads[0];
    return {
      badge: "Outlook live sync",
      title: "Outlook inbox inside CRM",
      description: threads.length
        ? "These messages and meetings are coming from Microsoft Graph after OAuth and sync."
        : "Connect and sync Outlook to load real mailbox activity here.",
      content: `
        <div class="crm-provider crm-provider-mail crm-provider-outlook">
          <aside class="crm-provider-sidebar compact">
            <article class="crm-provider-stat-card">
              <p class="summary-label">Focused inbox</p>
              <strong>${threads.length}</strong>
              <p class="summary-meta">Account: ${escapeHtml(workspace?.accountEmail || state.dashboard?.integrations?.outlook?.account || "Not connected")}</p>
            </article>
            <article class="crm-provider-stat-card">
              <p class="summary-label">Upcoming events</p>
              <strong>${meetings.length}</strong>
              <p class="summary-meta">${meetings[0] ? escapeHtml(meetings[0].title) : "No Outlook events synced yet."}</p>
            </article>
          </aside>
          <section class="crm-provider-main">
            <div class="crm-provider-thread-header">
              <div>
                <p class="crm-provider-thread-title">${escapeHtml(activeThread?.subject || "Live Outlook inbox")}</p>
                <p class="crm-provider-thread-copy">${escapeHtml(activeThread?.fromName || accountLabel)}</p>
              </div>
              <span class="tracker-pill">Graph live</span>
            </div>
            <div class="crm-mail-list">
              ${threads.length
                ? threads
                    .map((thread) => `
                      <article class="crm-mail-row outlook-row">
                        <div>
                          <p class="crm-provider-list-title">${escapeHtml(thread.subject || "(no subject)")}</p>
                          <p class="crm-provider-list-copy">${escapeHtml(thread.fromName || thread.fromEmail || "Unknown sender")}</p>
                        </div>
                        <p class="crm-provider-list-copy">${escapeHtml(thread.snippet || formatWorkspaceTime(thread.receivedAt))}</p>
                      </article>
                    `)
                    .join("")
                : '<article class="crm-provider-stat-card"><p class="summary-meta">No Outlook threads have been synced yet.</p></article>'}
            </div>
          </section>
        </div>
      `,
    };
  }

  if (channel.key === "linkedin") {
    return {
      badge: "LinkedIn limitation",
      title: "LinkedIn is not full inbox-native yet",
      description: "LinkedIn blocks a full real in-CRM inbox unless you have approved partner API access. OAuth can still be connected for future expansion.",
      content: `
        <div class="crm-provider crm-provider-linkedin">
          <aside class="crm-provider-sidebar compact">
            <article class="crm-provider-stat-card">
              <p class="summary-label">Current state</p>
              <strong>Limited API access</strong>
              <p class="summary-meta">This provider cannot mirror a true LinkedIn messaging inbox in the same way as Gmail, Outlook, and WhatsApp.</p>
            </article>
          </aside>
          <section class="crm-provider-main">
            <div class="crm-linkedin-card">
              <p class="crm-provider-list-title">${escapeHtml(contactName)}</p>
              <p class="crm-provider-list-copy">${escapeHtml(contactTitle)}</p>
              <p class="crm-provider-panel-copy">${escapeHtml(recentActivity)}</p>
            </div>
          </section>
        </div>
      `,
    };
  }

  return {
    badge: "Contact workspace",
    title: "All contacts overview",
    description: "Unified CRM view across all connected sources.",
    content: `
      <div class="crm-provider crm-provider-all">
        <div class="crm-provider-grid">
          ${contacts.map((contact) => `
            <article class="crm-provider-stat-card">
              <p class="crm-provider-list-title">${escapeHtml(contact.name)}</p>
              <p class="crm-provider-list-copy">${escapeHtml(contact.source || "CRM")} ? ${escapeHtml(contact.stage || "No stage")}</p>
              <p class="crm-provider-panel-copy">${escapeHtml(contact.lastActivity || "No activity")}</p>
            </article>
          `).join("")}
        </div>
      </div>
    `,
  };
}

function renderEmbeddedContactsApp(channel, contacts) {
  const container = $("contacts-embedded-app");
  if (!container) return;

  const workspace = buildChannelWorkspace(channel, contacts);
  container.innerHTML = `
    <section class="contacts-embedded-shell">
      <div class="contacts-embedded-header">
        <div>
          <p class="summary-label">${workspace.badge}</p>
          <h3 class="contacts-embedded-title">${workspace.title}</h3>
          <p class="contacts-embedded-copy">${workspace.description}</p>
        </div>
      </div>
      <div class="contacts-embedded-native-wrap">
        ${workspace.content}
      </div>
    </section>
  `;
}
function filteredContacts() {
  const channel = getContactsChannel();
  const contacts = getContactsForChannel(channel);
  if (!state.query) return contacts;

  const query = state.query.toLowerCase();
  return contacts.filter((contact) =>
    [contact.name, contact.company, contact.title, contact.email, contact.stage, contact.source]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)),
  );
}

function filteredActivity() {
  const activity = state.dashboard?.activity || [];
  if (!state.query) return activity;

  const query = state.query.toLowerCase();
  return activity.filter((item) =>
    [item.source, item.message, item.time]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)),
  );
}

function renderShell() {
  const meta = viewMeta[state.activeView];
  $("page-title").textContent = meta.title;
  $("page-subtitle").textContent = meta.subtitle;

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });

  document.querySelectorAll("[data-view-section]").forEach((section) => {
    section.classList.toggle("hidden", section.dataset.viewSection !== state.activeView);
  });
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item?.[key] || "Unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function renderBarRows(entries, total, tone = "slate") {
  if (!entries.length) {
    return '<p class="text-sm text-muted">No data available yet.</p>';
  }

  return entries
    .map(([label, value]) => {
      const width = total ? Math.max(8, Math.round((value / total) * 100)) : 0;
      return `
        <div class="overview-bar-row">
          <div class="overview-bar-label-wrap">
            <span class="overview-bar-label">${escapeHtml(label)}</span>
            <span class="overview-bar-value">${value}</span>
          </div>
          <div class="overview-bar-track">
            <div class="overview-bar-fill ${tone}" style="width:${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function buildPieChart(entries) {
  if (!entries.length) {
    return '<p class="text-sm text-muted">No activity data available yet.</p>';
  }

  const colors = ["#091426", "#0f766e", "#f59e0b", "#2563eb", "#dc2626", "#7c3aed"];
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  let current = 0;
  const segments = entries.map(([label, value], index) => {
    const start = total ? Math.round((current / total) * 360) : 0;
    current += value;
    const end = total ? Math.round((current / total) * 360) : 0;
    return {
      label,
      value,
      color: colors[index % colors.length],
      start,
      end,
      percent: total ? Math.round((value / total) * 100) : 0,
    };
  });

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`)
    .join(", ");

  return `
    <div class="overview-chart-headline">
      <strong>Activity split</strong>
      <span>${total} recent events</span>
    </div>
    <div class="overview-pie-layout">
      <div class="overview-pie" style="background: conic-gradient(${gradient});">
        <div class="overview-pie-center">
          <strong>${total}</strong>
          <span>events</span>
        </div>
      </div>
      <div class="overview-pie-legend">
        ${segments.map((segment) => `
          <div class="overview-pie-legend-row">
            <div class="overview-pie-legend-label">
              <span class="overview-pie-dot" style="background:${segment.color}"></span>
              <span>${escapeHtml(segment.label)}</span>
            </div>
            <span class="overview-pie-legend-value">${segment.value} - ${segment.percent}%</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderOverviewDashboard() {
  if (!state.dashboard) return;

  const contacts = state.dashboard.contacts || [];
  const deals = state.dashboard.deals || [];
  const activity = state.dashboard.activity || [];
  const integrations = state.dashboard.integrations || {};
  const connectedCount = getConnectedCount(integrations);
  const qualifiedCount = contacts.filter((contact) => contact.stage === "Qualified").length;
  const proposalValue = deals.filter((deal) => deal.stage === "Proposal").reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const followUps = contacts.filter((contact) => ["Qualified", "Proposal"].includes(contact.stage)).length;

  $("overview-kpis").innerHTML = `
    <article class="overview-kpi-card emphasis">
      <p class="summary-label">Connected channels</p>
      <strong class="summary-value">${connectedCount}</strong>
      <p class="summary-meta">Live providers contributing to CRM visibility right now.</p>
    </article>
    <article class="overview-kpi-card">
      <p class="summary-label">Qualified contacts</p>
      <strong class="summary-value">${qualifiedCount}</strong>
      <p class="summary-meta">Leads ready for immediate follow-up or proposal movement.</p>
    </article>
    <article class="overview-kpi-card">
      <p class="summary-label">Proposal value</p>
      <strong class="summary-value">${money(proposalValue)}</strong>
      <p class="summary-meta">Open value sitting in the proposal stage.</p>
    </article>
    <article class="overview-kpi-card">
      <p class="summary-label">Planned follow-ups</p>
      <strong class="summary-value">${followUps}</strong>
      <p class="summary-meta">Contacts in qualified or proposal stages needing a next step.</p>
    </article>
  `;

  const stageCounts = Object.entries(countBy(contacts, "stage"));
  $("overview-stage-chart").innerHTML = `
    <div class="overview-chart-headline">
      <strong>Lead stages</strong>
      <span>${contacts.length} visible contacts</span>
    </div>
    ${renderBarRows(stageCounts, contacts.length, "navy")}
  `;

  const channelCounts = Object.entries(countBy(contacts, "source"));
  $("overview-channel-chart").innerHTML = `
    <div class="overview-chart-headline">
      <strong>Channel contribution</strong>
      <span>${channelCounts.length} active sources</span>
    </div>
    ${renderBarRows(channelCounts, contacts.length, "teal")}
  `;

  const taskAssignments = buildTaskAssignments(contacts, deals);
  const ownerCounts = Object.entries(taskAssignments.reduce((acc, item) => {
    acc[item.owner] = (acc[item.owner] || 0) + 1;
    return acc;
  }, {}));
  $("overview-owner-chart").innerHTML = `
    <div class="overview-chart-headline">
      <strong>Owner workload</strong>
      <span>${taskAssignments.length} planned tasks</span>
    </div>
    ${renderBarRows(ownerCounts, taskAssignments.length, "amber")}
  `;

  const activityCounts = Object.entries(countBy(activity, "source"));
  $("overview-activity-pie").innerHTML = buildPieChart(activityCounts);

  $("overview-activity-strip").innerHTML = activity.length
    ? activity.slice(0, 6).map((item, index) => `
        <article class="activity-chip ${index === 0 ? "active" : ""}">
          <p class="activity-chip-time">${escapeHtml(item.time || "--")}</p>
          <p class="activity-chip-source">${escapeHtml(item.source || "System")}</p>
        </article>
      `).join("")
    : '<p class="text-sm text-muted">No recent activity yet.</p>';
}

function renderSummary() {
  if (!state.dashboard) return;

  const { integrations } = state.dashboard;
  const connectedCount = getConnectedCount(integrations);
  const readiness = Math.round((connectedCount / Object.keys(integrations).length) * 100);

  if ($("sidebar-connected-count")) {
    $("sidebar-connected-count").textContent = `${connectedCount} live`;
  }
  if ($("sidebar-readiness-bar")) {
    $("sidebar-readiness-bar").style.width = `${readiness}%`;
  }
  if ($("sidebar-readiness-text")) {
    $("sidebar-readiness-text").textContent = getReadinessText(connectedCount);
  }
}

function buildActionItems(contacts, deals, activity) {
  const qualifiedContacts = contacts
    .filter((contact) => contact.stage === "Qualified")
    .slice(0, 2)
    .map((contact, index) => ({
      title: `Follow up with ${contact.name}`,
      detail: `${contact.company || "Contact"} is qualified and ready for the next touchpoint.`,
      status: index === 0 ? "Due today" : "Queued",
    }));

  const proposalDeals = deals
    .filter((deal) => deal.stage === "Proposal")
    .slice(0, 1)
    .map((deal) => ({
      title: `Advance ${deal.name}`,
      detail: `Proposal-stage opportunity worth ${money(deal.value)} needs the next step locked in.`,
      status: "Priority",
    }));

  const recentSystemAction = activity.slice(-1).map((item) => ({
    title: `Review latest ${item.source || "system"} update`,
    detail: item.message || "Recent CRM activity is available for review.",
    status: item.time || "Recent",
  }));

  return [...qualifiedContacts, ...proposalDeals, ...recentSystemAction].slice(0, 4);
}

function buildTaskAssignments(contacts, deals) {
  const owners = ["Aisha", "Rahul", "Maya", "Jordan"];
  const tasks = [];

  contacts.slice(0, 2).forEach((contact, index) => {
    tasks.push({
      owner: owners[index],
      task: `Reconnect with ${contact.name}`,
      detail: `${contact.source || "CRM"} lead from ${contact.company || "active account"}.`,
      eta: index === 0 ? "Today" : "Tomorrow",
    });
  });

  deals.slice(0, 2).forEach((deal, index) => {
    tasks.push({
      owner: owners[index + 2],
      task: `Move ${deal.name}`,
      detail: `${deal.stage} deal worth ${money(deal.value)}.`,
      eta: index === 0 ? "This afternoon" : "This week",
    });
  });

  return tasks.slice(0, 4);
}

function renderTrackerList(elementId, items, formatter) {
  const container = $(elementId);
  if (!container) return;

  container.innerHTML = items.length
    ? items.map(formatter).join("")
    : '<p class="text-sm text-muted">No tracker items available yet.</p>';
}

function renderActivity() {
  const activityFeed = $("activity-feed");
  const items = filteredActivity();

  activityFeed.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <article class="activity-item">
              <span class="activity-time">${item.time || "-"}</span>
              <div>
                <p class="font-semibold text-primary">${item.source || "System"}</p>
                <p class="activity-copy">${item.message || ""}</p>
              </div>
            </article>
          `,
        )
        .join("")
    : `<p class="text-sm text-muted">No activity matches the current search.</p>`;
}

function renderContacts() {
  const contactsTable = $("contacts-table");
  const channelTabs = $("contacts-channel-tabs");
  const channelSummary = $("contacts-channel-summary");
  const panelTitle = $("contacts-panel-title");
  const panelCopy = $("contacts-panel-copy");
  const activeChannel = getContactsChannel();
  const contacts = filteredContacts();
  const allChannelContacts = getContactsForChannel(activeChannel);
  const stageSummary = allChannelContacts.reduce((acc, contact) => {
    acc[contact.stage] = (acc[contact.stage] || 0) + 1;
    return acc;
  }, {});
  const topStage = Object.entries(stageSummary).sort((a, b) => b[1] - a[1])[0]?.[0] || "No stage yet";

  channelTabs.innerHTML = contactsChannelConfig
    .map((channel) => {
      const count = getContactsForChannel(channel).length;
      return `
        <button
          class="contacts-channel-tab${channel.key === activeChannel.key ? " active" : ""}"
          data-contact-channel="${channel.key}"
          type="button"
        >
          <span class="contacts-channel-tab-label">${channel.label}${channel.key !== "all" ? `<span class="material-symbols-outlined contacts-channel-tab-icon">apps</span>` : ""}</span>
          <span class="contacts-channel-tab-count">${count}</span>
        </button>
      `;
    })
    .join("");

  panelTitle.textContent = activeChannel.key === "all"
    ? "Customer and lead records"
    : `${activeChannel.label} contacts`;
  panelCopy.textContent = activeChannel.key === "all"
    ? activeChannel.description
    : `${activeChannel.description} This panel now reflects CRM-native live data where the provider API allows it.`;

  channelSummary.innerHTML = `
    <article class="contacts-channel-card">
      <p class="summary-label">Visible records</p>
      <strong>${allChannelContacts.length}</strong>
      <p class="summary-meta">${state.query ? `${contacts.length} shown after search filtering.` : "All records in this channel are visible below."}</p>
    </article>
    <article class="contacts-channel-card">
      <p class="summary-label">Top stage</p>
      <strong>${topStage}</strong>
      <p class="summary-meta">Most common stage inside the ${activeChannel.label.toLowerCase()} contact stream.</p>
    </article>
  `;

  renderEmbeddedContactsApp(activeChannel, allChannelContacts);

  contactsTable.innerHTML = contacts.length
    ? contacts
        .map(
          (contact) => `
            <tr class="contact-row">
              <td>
                <div class="contact-name">
                  <span class="avatar">${initials(contact.name)}</span>
                  <div>
                    <p class="font-semibold text-primary">${contact.name}</p>
                    <p class="text-sm text-muted">${contact.title || ""} ${contact.company ? `at ${contact.company}` : ""}</p>
                    <p class="text-sm text-muted">${contact.email || ""}</p>
                  </div>
                </div>
              </td>
              <td>${contact.stage || "-"}</td>
              <td>${contact.source || "-"}</td>
              <td>${contact.lastActivity || "-"}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="4" class="px-4 py-6 text-sm text-muted">No ${activeChannel.label.toLowerCase()} contacts match the current search.</td></tr>`;
}

function renderPipeline() {
  const board = $("pipeline-board");
  const deals = state.dashboard?.deals || [];

  board.innerHTML = pipelineStages
    .map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage.key);
      return `
        <section class="kanban-column">
          <div class="kanban-column-header">
            <div class="kanban-column-title">
              <span class="kanban-dot" style="background:${stage.color}"></span>
              <span>${stage.title}</span>
            </div>
            <span class="kanban-count">${stageDeals.length}</span>
          </div>
          <div>
            ${
              stageDeals.length
                ? stageDeals
                    .map(
                      (deal) => `
                        <article class="deal-card">
                          <p class="deal-name">${deal.name}</p>
                          <p class="deal-meta">${money(deal.value)} opportunity in ${stage.title.toLowerCase()}.</p>
                        </article>
                      `,
                    )
                    .join("")
                : `<div class="deal-card"><p class="deal-meta">No deals in this stage yet.</p></div>`
            }
          </div>
        </section>
      `;
    })
    .join("");
}

function renderIntegrations() {
  const grid = $("integrations-grid");
  const integrations = state.dashboard?.integrations || {};

  grid.innerHTML = Object.entries(integrations)
    .map(([key, integration]) => {
      const config = integrationConfig[key];
      const isOAuth = key !== "whatsapp";
      const statusTone = integration.connected
        ? `<span class="font-semibold text-success">Connected</span>`
        : `<span class="font-semibold text-warning">Not connected</span>`;
      const account = integration.account || integration.status || "Ready for setup";
      const actionButton = integration.connected
        ? `<button class="action-btn" data-action="disconnect" data-provider="${key}" type="button">Disconnect</button>
           <button class="action-btn primary" data-action="sync" data-provider="${key}" type="button">Sync now</button>`
        : isOAuth
          ? `<button class="action-btn primary" data-action="oauth" data-provider="${key}" type="button">Connect</button>`
          : `<button class="action-btn primary" data-action="connect" data-provider="${key}" type="button">Connect</button>`;

      return `
        <article class="integration-card">
          <div class="integration-accent" style="background:${config.accent}"></div>
          <div class="integration-body">
            <div class="integration-header">
              <div class="flex gap-4">
                <span class="integration-icon" style="background:${config.soft}; color:${config.accent}">
                  <span class="material-symbols-outlined">${config.icon}</span>
                </span>
                <div>
                  <h3 class="integration-name">${config.label}</h3>
                  <p class="integration-subtitle">${config.subtitle}</p>
                </div>
              </div>
              <span class="rounded-full bg-surface-soft px-3 py-1 font-label text-xs text-primary">${integration.scope || "-"}</span>
            </div>

            <p class="integration-copy">${integration.status || "Ready"}</p>

            <div class="integration-status">
              ${statusTone}<br />
              <span class="text-sm text-muted">Account: ${account}</span><br />
              <span class="text-sm text-muted">Last sync: ${integration.lastSync || "Not synced yet"}</span>
            </div>

            <div class="integration-actions">
              ${actionButton}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function populateSettings() {
  const credentials = state.settings?.credentials;
  if (!credentials) return;

  const form = $("settings-form");
  form.elements.gmailClientId.value = credentials.gmail.clientId || "";
  form.elements.gmailClientSecret.value = "";
  form.elements.outlookClientId.value = credentials.outlook.clientId || "";
  form.elements.outlookClientSecret.value = "";
  form.elements.outlookTenantId.value = credentials.outlook.tenantId || "common";
  form.elements.linkedinClientId.value = credentials.linkedin.clientId || "";
  form.elements.linkedinClientSecret.value = "";
  form.elements.linkedinScope.value = credentials.linkedin.scope || "";
  form.elements.whatsappAccessToken.value = "";
  form.elements.whatsappPhoneNumberId.value = state.settings?.whatsapp?.phoneNumberId || "";
  form.elements.whatsappBusinessAccountId.value = state.settings?.whatsapp?.businessAccountId || "";
  form.elements.whatsappWebhookVerifyToken.value = "";
  $("webhook-url").textContent = `WhatsApp webhook URL: ${state.settings?.whatsapp?.webhookUrl || "-"}`;
}

function defaultLeadWorkflow() {
  return {
    regions: [],
    roles: ["Founder", "CEO"],
    fields: ["Email", "Mobile", "Company"],
    approvals: [
      "Save qualified leads to Excel",
      "Notify CRM owner for review",
      "Prepare LinkedIn draft messages",
      "Send WhatsApp approval prompt",
    ],
    templateNote: "Hi {{name}}, I wanted to reach out about {{company}}.",
    draftAccount: "",
    status: "Waiting for filters",
    lastRun: null,
    drafts: [],
    approvalsQueue: [],
  };
}

function hydrateLeadWorkflow(raw) {
  return {
    ...defaultLeadWorkflow(),
    ...(raw || {}),
    regions: Array.isArray(raw?.regions) ? raw.regions : [],
    roles: Array.isArray(raw?.roles) ? raw.roles : ["Founder", "CEO"],
    fields: Array.isArray(raw?.fields) ? raw.fields : ["Email", "Mobile", "Company"],
    approvals: Array.isArray(raw?.approvals)
      ? raw.approvals
      : ["Save qualified leads to Excel", "Notify CRM owner for review", "Prepare LinkedIn draft messages", "Send WhatsApp approval prompt"],
    drafts: Array.isArray(raw?.drafts) ? raw.drafts : [],
    approvalsQueue: Array.isArray(raw?.approvalsQueue) ? raw.approvalsQueue : [],
  };
}

function loadLeadWorkflow() {
  try {
    const saved = window.localStorage.getItem(LEAD_WORKFLOW_STORAGE_KEY);
    state.leadWorkflow = hydrateLeadWorkflow(saved ? JSON.parse(saved) : null);
  } catch {
    state.leadWorkflow = defaultLeadWorkflow();
  }
}

function saveLeadWorkflow() {
  window.localStorage.setItem(LEAD_WORKFLOW_STORAGE_KEY, JSON.stringify(state.leadWorkflow));
}

function formatWorkflowList(values, fallback) {
  return values && values.length ? values.join(", ") : fallback;
}

function titleMatchesRole(title, roles) {
  const normalizedTitle = String(title || "").toLowerCase();
  return roles.some((role) => normalizedTitle.includes(String(role).toLowerCase()));
}

function selectLeadFields(lead, fields) {
  const selected = {
    name: lead.name,
    company: lead.company,
    title: lead.title,
    region: lead.region,
  };

  fields.forEach((field) => {
    if (field === "Email") selected.email = lead.email || "";
    if (field === "Mobile") selected.mobile = lead.mobile || "";
    if (field === "Company") selected.company = lead.company || "";
    if (field === "Headline") selected.headline = lead.headline || "";
    if (field === "Location") selected.location = lead.region || "";
    if (field === "Other details") selected.linkedinUrl = lead.linkedinUrl || "";
  });

  return selected;
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  if (!rows.length) return "name,company,title,region\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  });
  return `${lines.join("\n")}\n`;
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderWorkflowRunResults(workflow) {
  const run = workflow.lastRun;
  $("workflow-run-results").innerHTML = run?.qualifiedLeads?.length
    ? run.qualifiedLeads
        .map(
          (lead) => `
            <article class="tracker-item">
              <div>
                <p class="tracker-title">${lead.name} • ${lead.company}</p>
                <p class="tracker-copy">${lead.title} in ${lead.region}. ${lead.email ? `Email: ${lead.email}. ` : ""}${lead.mobile ? `Mobile: ${lead.mobile}.` : ""}</p>
              </div>
              <span class="tracker-pill">Qualified</span>
            </article>
          `,
        )
        .join("")
    : '<p class="text-sm text-muted">Run the workflow to see qualified leads here.</p>';
}

function renderWorkflowDraftResults(workflow) {
  $("workflow-draft-results").innerHTML = workflow.drafts.length
    ? workflow.drafts
        .map(
          (draft) => `
            <article class="tracker-item">
              <div>
                <p class="tracker-title">${draft.leadName} • ${draft.account}</p>
                <p class="tracker-copy">${draft.message}</p>
              </div>
              <span class="tracker-pill">${draft.status}</span>
            </article>
          `,
        )
        .join("")
    : '<p class="text-sm text-muted">Generate drafts after a qualification run.</p>';
}

function renderLeadWorkflow() {
  const workflow = state.leadWorkflow || defaultLeadWorkflow();

  $("workflow-status-pill").textContent = workflow.status;
  $("workflow-regions").textContent = formatWorkflowList(workflow.regions, "Not configured");
  $("workflow-roles").textContent = formatWorkflowList(workflow.roles, "Founders and operators");
  $("workflow-fields").textContent = formatWorkflowList(workflow.fields, "Email, mobile, company context");
  $("workflow-delivery").textContent = workflow.approvals.length
    ? workflow.approvals.slice(0, 2).join(" and ")
    : "Excel review and draft approval";

  const steps = [
    {
      title: "1. Filter and qualify",
      detail: `Run the workflow against an approved lead pool using ${formatWorkflowList(workflow.regions, "selected regions")} and ${formatWorkflowList(workflow.roles, "selected roles")}.`,
      status: workflow.regions.length ? "Configured" : "Pending",
    },
    {
      title: "2. Export for Excel review",
      detail: `Qualified leads can be exported with ${formatWorkflowList(workflow.fields, "selected fields")}.`,
      status: workflow.lastRun?.qualifiedLeads?.length ? "Ready to export" : "Awaiting run",
    },
    {
      title: "3. Prepare personalized drafts",
      detail: workflow.templateNote || "Use stored template or ask the user to upload one.",
      status: workflow.drafts.length ? "Drafted" : "Template ready",
    },
    {
      title: "4. Approval checkpoints",
      detail: `Approval queue contains ${workflow.approvalsQueue.length} request(s) for CRM or WhatsApp review before any human-led sending.`,
      status: workflow.approvalsQueue.length ? "Queued" : "Manual approval",
    },
  ];

  $("workflow-steps").innerHTML = steps
    .map(
      (item) => `
        <article class="tracker-item">
          <div>
            <p class="tracker-title">${item.title}</p>
            <p class="tracker-copy">${item.detail}</p>
          </div>
          <span class="tracker-pill">${item.status}</span>
        </article>
      `,
    )
    .join("");

  renderWorkflowRunResults(workflow);
  renderWorkflowDraftResults(workflow);
}

function openLeadWorkflowModal() {
  const workflow = state.leadWorkflow || defaultLeadWorkflow();
  document.querySelectorAll('input[name="regions"]').forEach((input) => {
    input.checked = workflow.regions.includes(input.value);
  });
  document.querySelectorAll('input[name="roles"]').forEach((input) => {
    input.checked = workflow.roles.includes(input.value);
  });
  document.querySelectorAll('input[name="fields"]').forEach((input) => {
    input.checked = workflow.fields.includes(input.value);
  });
  document.querySelectorAll('input[name="approvals"]').forEach((input) => {
    input.checked = workflow.approvals.includes(input.value);
  });
  $("workflow-template-note").value = workflow.templateNote || "";
  $("workflow-draft-account").value = workflow.draftAccount || "";
  $("lead-workflow-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeLeadWorkflowModal() {
  $("lead-workflow-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function handleLeadWorkflowSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const regions = Array.from(form.querySelectorAll('input[name="regions"]:checked')).map((input) => input.value);
  const roles = Array.from(form.querySelectorAll('input[name="roles"]:checked')).map((input) => input.value);
  const fields = Array.from(form.querySelectorAll('input[name="fields"]:checked')).map((input) => input.value);
  const approvals = Array.from(form.querySelectorAll('input[name="approvals"]:checked')).map((input) => input.value);
  const customRoles = $("workflow-custom-roles").value
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  state.leadWorkflow = hydrateLeadWorkflow({
    ...state.leadWorkflow,
    regions,
    roles: [...roles, ...customRoles],
    fields,
    approvals,
    templateNote: $("workflow-template-note").value.trim() || "Hi {{name}}, I wanted to reach out about {{company}}.",
    draftAccount: $("workflow-draft-account").value.trim(),
    status: regions.length && fields.length ? "Workflow saved" : "Needs filter review",
  });

  saveLeadWorkflow();
  renderLeadWorkflow();
  closeLeadWorkflowModal();
  showAlert("Lead workflow saved. You can now run qualification, export CSV, generate drafts, and queue approval.", "success");
}

function handleRunLeadWorkflow() {
  const workflow = hydrateLeadWorkflow(state.leadWorkflow);
  const qualifiedLeads = SAFE_LEAD_POOL
    .filter((lead) => {
      const regionMatch = !workflow.regions.length || workflow.regions.includes(lead.region);
      const roleMatch = !workflow.roles.length || titleMatchesRole(lead.title, workflow.roles);
      return regionMatch && roleMatch;
    })
    .map((lead) => selectLeadFields(lead, workflow.fields));

  state.leadWorkflow = hydrateLeadWorkflow({
    ...workflow,
    status: qualifiedLeads.length ? `${qualifiedLeads.length} qualified leads ready` : "No leads matched current filters",
    lastRun: {
      createdAt: new Date().toISOString(),
      qualifiedLeads,
    },
  });

  saveLeadWorkflow();
  renderLeadWorkflow();
  showAlert(`Qualification run completed with ${qualifiedLeads.length} lead(s).`, "success");
}

function handleExportLeadWorkflow() {
  const rows = state.leadWorkflow?.lastRun?.qualifiedLeads || [];
  if (!rows.length) {
    showAlert("Run qualification first so there is data to export.", "error");
    return;
  }
  downloadTextFile("qualified-leads.csv", toCsv(rows), "text/csv;charset=utf-8");
  showAlert("Qualified leads exported as CSV for Excel review.", "success");
}

function handleGenerateWorkflowDrafts() {
  const workflow = hydrateLeadWorkflow(state.leadWorkflow);
  const leads = workflow.lastRun?.qualifiedLeads || [];
  if (!leads.length) {
    showAlert("Run qualification first, then generate drafts.", "error");
    return;
  }

  const drafts = leads.map((lead) => ({
    leadName: lead.name,
    company: lead.company,
    account: workflow.draftAccount || "Primary LinkedIn account",
    status: "Drafted",
    message: (workflow.templateNote || "Hi {{name}}, I wanted to reach out about {{company}}.")
      .replace(/\{\{name\}\}/g, lead.name)
      .replace(/\{\{company\}\}/g, lead.company)
      .replace(/\{\{title\}\}/g, lead.title || ""),
  }));

  state.leadWorkflow = hydrateLeadWorkflow({
    ...workflow,
    drafts,
    status: drafts.length ? `${drafts.length} drafts ready for review` : workflow.status,
  });

  saveLeadWorkflow();
  renderLeadWorkflow();
  showAlert(`${drafts.length} draft message(s) prepared for review.`, "success");
}

function handleRequestWorkflowApproval() {
  const workflow = hydrateLeadWorkflow(state.leadWorkflow);
  const approval = {
    createdAt: new Date().toISOString(),
    channel: workflow.approvals.includes("Send WhatsApp approval prompt") ? "WhatsApp + CRM" : "CRM",
    status: "Pending approval",
  };

  state.leadWorkflow = hydrateLeadWorkflow({
    ...workflow,
    approvalsQueue: [approval, ...workflow.approvalsQueue].slice(0, 10),
    status: "Approval queued",
  });

  saveLeadWorkflow();
  renderLeadWorkflow();
  showAlert("Approval request queued. Human review is still required before any sending step.", "success");
}

function renderTrackers() {
  if (!state.dashboard) return;

  const actionItems = buildActionItems(
    state.dashboard.contacts || [],
    state.dashboard.deals || [],
    state.dashboard.activity || [],
  );
  const taskAssignments = buildTaskAssignments(
    state.dashboard.contacts || [],
    state.dashboard.deals || [],
  );

  renderTrackerList(
    "action-tracker",
    actionItems,
    (item) => `
      <article class="tracker-item">
        <div>
          <p class="tracker-title">${item.title}</p>
          <p class="tracker-copy">${item.detail}</p>
        </div>
        <span class="tracker-pill">${item.status}</span>
      </article>
    `,
  );

  renderTrackerList(
    "task-assignment-tracker",
    taskAssignments,
    (item) => `
      <article class="tracker-item">
        <div>
          <p class="tracker-title">${item.task}</p>
          <p class="tracker-copy">${item.owner} owns this next step. ${item.detail}</p>
        </div>
        <span class="tracker-pill">${item.eta}</span>
      </article>
    `,
  );
}

function render() {
  renderShell();
  renderSummary();
  renderOverviewDashboard();
  renderActivity();
  renderContacts();
  renderPipeline();
  renderIntegrations();
  renderTrackers();
  populateSettings();
}

async function loadDashboard() {
  state.dashboard = await requestJson("/api/dashboard");
}

async function loadSettings() {
  state.settings = await requestJson("/api/settings/providers");
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadSettings()]);
  render();
}

async function handleIntegrationAction(action, provider) {
  try {
    clearAlert();

    if (action === "oauth") {
      const providerMap = {
        gmail: "/api/auth/google/start",
        outlook: "/api/auth/microsoft/start",
        linkedin: "/api/auth/linkedin/start",
      };
      window.location.href = providerMap[provider];
      return;
    }

    if (action === "connect") {
      await requestJson("/api/integrations/connect", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      showAlert(`${integrationConfig[provider].label} connected successfully.`, "success");
    }

    if (action === "disconnect") {
      await requestJson("/api/integrations/disconnect", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      showAlert(`${integrationConfig[provider].label} disconnected.`, "success");
    }

    if (action === "sync") {
      await requestJson("/api/integrations/sync", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      showAlert(`${integrationConfig[provider].label} synced successfully.`, "success");
    }

    await refreshAll();
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function handleSyncAll() {
  try {
    clearAlert();
    await requestJson("/api/integrations/sync", {
      method: "POST",
      body: JSON.stringify({ provider: "all" }),
    });
    await refreshAll();
    showAlert("All connected providers synced successfully.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function handleWhatsAppSend(button) {
  const to = button.dataset.phone || "";
  const name = button.dataset.name || "";
  const input = $("whatsapp-compose-input");
  const text = input?.value.trim() || "";

  if (!to) {
    showAlert("No WhatsApp conversation is selected yet. Receive or sync a thread first.", "error");
    return;
  }

  if (!text) {
    showAlert("Type a WhatsApp message before sending.", "error");
    return;
  }

  try {
    clearAlert();
    await requestJson("/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ to, text, name }),
    });
    if (input) input.value = "";
    await refreshAll();
    showAlert("WhatsApp message sent from the CRM workspace.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function handleResetDemo() {
  const providers = Object.keys(state.dashboard?.integrations || {});

  try {
    clearAlert();
    await Promise.all(
      providers
        .filter((provider) => state.dashboard.integrations[provider].connected)
        .map((provider) =>
          requestJson("/api/integrations/disconnect", {
            method: "POST",
            body: JSON.stringify({ provider }),
          }),
        ),
    );
    await refreshAll();
    showAlert("Demo integrations have been reset.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function handleSaveSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    clearAlert();
    await requestJson("/api/settings/providers", {
      method: "POST",
      body: JSON.stringify({
        credentials: {
          gmail: {
            clientId: form.elements.gmailClientId.value,
            clientSecret: form.elements.gmailClientSecret.value,
          },
          outlook: {
            clientId: form.elements.outlookClientId.value,
            clientSecret: form.elements.outlookClientSecret.value,
            tenantId: form.elements.outlookTenantId.value,
          },
          linkedin: {
            clientId: form.elements.linkedinClientId.value,
            clientSecret: form.elements.linkedinClientSecret.value,
            scope: form.elements.linkedinScope.value,
          },
          whatsapp: {
            accessToken: form.elements.whatsappAccessToken.value,
            phoneNumberId: form.elements.whatsappPhoneNumberId.value,
            businessAccountId: form.elements.whatsappBusinessAccountId.value,
            webhookVerifyToken: form.elements.whatsappWebhookVerifyToken.value,
          },
        },
      }),
    });
    await refreshAll();
    showAlert("Provider settings saved.", "success");
    form.elements.gmailClientSecret.value = "";
    form.elements.outlookClientSecret.value = "";
    form.elements.linkedinClientSecret.value = "";
    form.elements.whatsappAccessToken.value = "";
    form.elements.whatsappWebhookVerifyToken.value = "";
  } catch (error) {
    showAlert(error.message, "error");
  }
}

function bindEvents() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.view;
      renderShell();
    });
  });

  $("contacts-channel-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-contact-channel]");
    if (!button) return;
    state.activeContactsChannel = button.dataset.contactChannel;
    renderContacts();
  });

  $("contacts-embedded-app").addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="send-whatsapp"]');
    if (!button) return;
    handleWhatsAppSend(button);
  });

  $("extract-cta").addEventListener("click", () => {
    state.activeView = "extraction";
    renderShell();
  });

  $("sync-all").addEventListener("click", handleSyncAll);
  $("reset-demo").addEventListener("click", handleResetDemo);
  $("refresh-dashboard").addEventListener("click", refreshAll);
  $("settings-form").addEventListener("submit", handleSaveSettings);
  $("run-lead-workflow").addEventListener("click", handleRunLeadWorkflow);
  $("export-lead-workflow").addEventListener("click", handleExportLeadWorkflow);
  $("generate-workflow-drafts").addEventListener("click", handleGenerateWorkflowDrafts);
  $("request-workflow-approval").addEventListener("click", handleRequestWorkflowApproval);
  $("open-lead-workflow").addEventListener("click", openLeadWorkflowModal);
  $("close-lead-workflow").addEventListener("click", closeLeadWorkflowModal);
  $("cancel-lead-workflow").addEventListener("click", closeLeadWorkflowModal);
  $("lead-workflow-form").addEventListener("submit", handleLeadWorkflowSubmit);
  $("lead-workflow-modal").addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") {
      closeLeadWorkflowModal();
    }
  });

  $("integrations-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    handleIntegrationAction(button.dataset.action, button.dataset.provider);
  });

  $("mock-extract").addEventListener("click", () => {
    const value = $("extraction-url").value.trim();
    showAlert(
      value
        ? `Extraction UI is ready. Next step is wiring a backend extractor for: ${value}`
        : "Extraction UI is ready. Add a source URL when you wire the backend workflow.",
      "info",
    );
  });

  $("search-input").addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderActivity();
    renderContacts();
  });

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const connected = params.get("connected");
  if (error) {
    showAlert(error, "error");
  } else if (connected) {
    showAlert(`${connected} connected successfully.`, "success");
  }
}

async function init() {
  loadLeadWorkflow();
  bindEvents();

  try {
    await refreshAll();
  } catch (error) {
    showAlert(error.message, "error");
  }
}

init();












