const API = "http://localhost:3000/api";
let historyData = [];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form = document.getElementById("profileForm");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultsEl = document.getElementById("results");
const scoreValue = document.getElementById("scoreValue");
const ringFill = document.getElementById("ringFill");
const verdictBadge = document.getElementById("verdictBadge");
const verdictDesc = document.getElementById("verdictDesc");
const checksList = document.getElementById("checksList");
const demoButtons = document.getElementById("demoButtons");
const logoutBtn = document.getElementById("logoutBtn");
const historyList = document.getElementById("historyList");
const totalAnalyses = document.getElementById("totalAnalyses");
const genuineProfiles = document.getElementById("genuineProfiles");
const suspiciousProfiles = document.getElementById("suspiciousProfiles");
const welcomeUser = document.getElementById("welcomeUser");
const searchHistory = document.getElementById("searchHistory");

logoutBtn.addEventListener("click", async () => {

  const response = await fetch("/api/logout");

  const result = await response.json();

  if (result.success) {
    window.location.href = "/login.html";
  }
  else {
    alert(result.message);
  }

});

async function checkAuth() {

  try {

    const response = await fetch(`${API}/check-auth`);

    if (!response.ok) {

      window.location.href = "/login.html";

      return;

    }

  } catch (err) {

    window.location.href = "/login.html";

  }

}

// ── Load demo profiles ────────────────────────────────────────────────────────
async function loadDemos() {
  try {
    const res = await fetch(`${API}/demo`);
    const demos = await res.json();
    demos.forEach((d) => {
      const btn = document.createElement("button");
      btn.className = "demo-btn";
      btn.textContent = d.label;
      btn.type = "button";
      btn.addEventListener("click", () => fillForm(d));
      demoButtons.appendChild(btn);
    });
  } catch {
    // silently skip if server not ready
  }
}

async function loadHistory() {

  try {

    const response = await fetch(`${API}/history`);

    const history = await response.json();
    historyData = history;

    historyList.innerHTML = "";

    renderHistory(historyData);


  } catch (err) {

    console.log(err);

  }

}

searchHistory.addEventListener("input", () => {

    const value = searchHistory.value.toLowerCase();

    const filtered = historyData.filter((item)=>{

        return item.username.toLowerCase().includes(value);

    });

    renderHistory(filtered);

});

function renderHistory(data){

    historyList.innerHTML = "";

    data.forEach((item) => {

        const date = new Date(item.createdAt);

        const formattedDate = date.toLocaleString("en-IN", {

            day:"2-digit",
            month:"short",
            year:"numeric",

            hour:"2-digit",
            minute:"2-digit",

        });

        historyList.innerHTML += `

        <div class="history-item">

            <h3>👤 ${item.username}</h3>

            <p><strong>Verdict :</strong> ${item.verdict}</p>

            <p><strong>Risk Score :</strong> ${item.riskScore}%</p>

            <p>📅 ${formattedDate}</p>

        </div>

        `;

    });

}

async function loadDashboard() {

  try {

    const response = await fetch(`${API}/dashboard`);

    const data = await response.json();

    totalAnalyses.textContent = data.totalAnalyses;
    genuineProfiles.textContent = data.genuineProfiles;
    suspiciousProfiles.textContent = data.suspiciousProfiles;

  } catch (err) {

    console.log(err);

  }

}

async function loadUser() {

  try {

    const response = await fetch(`${API}/user`);

    const user = await response.json();

    welcomeUser.textContent = `👋 Welcome ${user.username}`;

  } catch (err) {

    console.log(err);

  }

}

// ── Fill form from a profile object ──────────────────────────────────────────
function fillForm(p) {
  document.getElementById("username").value = p.username || "";
  document.getElementById("accountAgeDays").value = p.accountAgeDays ?? "";
  document.getElementById("followers").value = p.followers ?? "";
  document.getElementById("following").value = p.following ?? "";
  document.getElementById("postCount").value = p.postCount ?? "";
  document.getElementById("avgEngagement").value = p.avgEngagement ?? "";
  document.getElementById("bio").value = p.bio || "";
  document.getElementById("hasProfilePicture").checked = !!p.hasProfilePicture;
  document.getElementById("hasExternalLink").checked = !!p.hasExternalLink;
}

// ── Read form values ──────────────────────────────────────────────────────────
function readForm() {
  return {
    username: document.getElementById("username").value.trim(),
    accountAgeDays: Number(document.getElementById("accountAgeDays").value) || 0,
    followers: Number(document.getElementById("followers").value) || 0,
    following: Number(document.getElementById("following").value) || 0,
    postCount: Number(document.getElementById("postCount").value) || 0,
    avgEngagement: parseFloat(document.getElementById("avgEngagement").value) || 0,
    bio: document.getElementById("bio").value.trim(),
    hasProfilePicture: document.getElementById("hasProfilePicture").checked,
    hasExternalLink: document.getElementById("hasExternalLink").checked,
  };
}

// ── Render results ────────────────────────────────────────────────────────────
function renderResults(data) {
  const { riskScore, verdict, verdictClass, checks } = data;

  // Score ring (circumference = 2π×50 ≈ 314)
  const circumference = 314;
  const offset = circumference - (riskScore / 100) * circumference;
  ringFill.style.strokeDashoffset = offset;

  // Ring color
  const ringColor =
    verdictClass === "danger" ? "#f87171" :
      verdictClass === "warning" ? "#fbbf24" : "#34d399";
  ringFill.style.stroke = ringColor;

  // Animate score counter
  animateCounter(scoreValue, 0, riskScore, 900);

  // Verdict badge
  verdictBadge.textContent = verdict;
  verdictBadge.className = `verdict-badge ${verdictClass}`;

  // Description
  const descs = {
    danger: "Multiple strong indicators of a fake or bot account were detected. Treat interactions with caution.",
    warning: "Some suspicious signals found. This account may be inauthentic or low-quality.",
    success: "No major red flags detected. This profile appears to be genuine.",
  };
  verdictDesc.textContent = descs[verdictClass];

  // Checks list
  checksList.innerHTML = "";
  checks.forEach((c) => {
    if (c.weight === 0) return; // skip neutral/zero-weight signals
    const li = document.createElement("li");
    li.className = `check-item ${c.flagged ? "flagged" : "ok"}`;
    li.innerHTML = `
      <span class="check-icon">${c.flagged ? "⚠️" : "✅"}</span>
      <div class="check-info">
        <div class="check-label">${c.label}</div>
        <div class="check-detail">${c.detail}</div>
      </div>
      <span class="check-score">${c.score > 0 ? `+${c.score}` : "0"}</span>
    `;
    checksList.appendChild(li);
  });

  resultsEl.classList.remove("hidden");
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Counter animation ─────────────────────────────────────────────────────────
function animateCounter(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ── Form submit ───────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const profile = readForm();

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing…";

  try {
    const res = await fetch(`${API}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message);
      return;
    }

    const data = await res.json();
    renderResults(data);
    loadHistory();
    loadDashboard();
  } catch (err) {
    alert("Could not reach the server. Make sure it is running on port 3000.");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Profile";
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
checkAuth();
loadUser();
loadDemos();
loadHistory();
loadDashboard();