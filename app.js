const defaultState = {
  gmail: true,
  outlook: false,
  linkedin: false,
  lastSync: "2 min ago",
};

const storageKey = "pranavi-crm-state";

function loadState() {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return { ...defaultState };

  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

function saveState(state) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatLastSync() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function connectedCount(state) {
  return Object.entries(state).filter(
    ([key, value]) => key !== "lastSync" && value === true,
  ).length;
}

function updateSummary(state) {
  const count = connectedCount(state);
  document.getElementById("connected-count").textContent = String(count);
  document.getElementById("last-sync").textContent = state.lastSync;

  const readiness = Math.round((count / 3) * 100);
  document.getElementById("readiness-score").textContent = String(readiness);
  document.getElementById("readiness-bar").style.width = `${readiness}%`;
}

function updateCard(card, isConnected) {
  const button = card.querySelector(".toggle-btn");
  const pill = card.querySelector(".pill");

  card.classList.toggle("connected", isConnected);
  button.textContent = isConnected ? "Disconnect" : "Connect";
  pill.textContent = isConnected ? "Connected" : "Ready to connect";
  pill.classList.toggle("status-pill", isConnected);
}

function render(state) {
  document.querySelectorAll(".integration-card").forEach((card) => {
    const key = card.dataset.integration;
    updateCard(card, Boolean(state[key]));
  });

  updateSummary(state);
}

function syncAll(state) {
  state.lastSync = `Today at ${formatLastSync()}`;
  saveState(state);
  updateSummary(state);
}

const state = loadState();
render(state);

document.querySelectorAll(".integration-card").forEach((card) => {
  card.querySelector(".toggle-btn").addEventListener("click", () => {
    const key = card.dataset.integration;
    state[key] = !state[key];
    state.lastSync = state[key] ? `Today at ${formatLastSync()}` : "Awaiting sync";
    saveState(state);
    render(state);
  });
});

document.getElementById("sync-all").addEventListener("click", () => {
  syncAll(state);
});

document.getElementById("reset-demo").addEventListener("click", () => {
  Object.assign(state, defaultState);
  saveState(state);
  render(state);
});
