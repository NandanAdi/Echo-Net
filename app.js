const TRAILS = [
  {
    id: "chandratal",
    name: "Chandratal Lake",
    state: "Himachal Pradesh · Spiti Valley",
    elevation: 4300,
    distanceKm: 14,
    difficulty: "moderate",
    coord: "32.48°N, 77.62°E",
    basecamp: "Basecamp — Kaza Control",
    checkpoint: "Homestay — Batal Dhaba",
    hazards: [
      "Barometric drop detected near lake viewpoint — possible storm in ~40 min.",
      "Wind gusts rising past Kunzum ridge line — seek shelter below 4200m.",
      "Overnight temperature forecast to fall below -8°C at camp.",
    ],
  },
  {
    id: "kalsubai",
    name: "Kalsubai Peak",
    state: "Maharashtra · Ahmednagar",
    elevation: 1646,
    distanceKm: 6,
    difficulty: "easy",
    coord: "19.60°N, 73.71°E",
    basecamp: "Basecamp — Bari Village Control",
    checkpoint: "Checkpoint — Ladder Section 3",
    hazards: [
      "Iron ladder section reported slippery — monsoon moisture detected.",
      "Cloud cover thickening near summit — visibility dropping below 20m.",
      "Crowd density high at ladder 4 — expect 15 min queue delay.",
    ],
  },
  {
    id: "kedarkantha",
    name: "Kedarkantha",
    state: "Uttarakhand · Govind NP",
    elevation: 3810,
    distanceKm: 20,
    difficulty: "moderate",
    coord: "31.03°N, 78.23°E",
    basecamp: "Basecamp — Sankri Control",
    checkpoint: "Checkpoint — Juda Ka Talab",
    hazards: [
      "Fresh snow accumulation detected — pace lag flagged on ridge approach.",
      "Wind chill pushing effective temp to -15°C above treeline.",
      "Possible whiteout near summit ridge — route marker visibility low.",
    ],
  },
  {
    id: "vof",
    name: "Valley of Flowers",
    state: "Uttarakhand · Chamoli",
    elevation: 3658,
    distanceKm: 17,
    difficulty: "moderate",
    coord: "30.73°N, 79.60°E",
    basecamp: "Basecamp — Ghangaria Control",
    checkpoint: "Checkpoint — Pushpawati Bridge",
    hazards: [
      "Pushpawati river level rising — bridge crossing flagged unstable.",
      "Dense mist rolling in from the valley floor — reduced trail visibility.",
      "Rockfall risk elevated on the Hemkund diversion path.",
    ],
  },
  {
    id: "hampta",
    name: "Hampta Pass",
    state: "Himachal Pradesh · Kullu",
    elevation: 4270,
    distanceKm: 26,
    difficulty: "hard",
    coord: "32.24°N, 77.27°E",
    basecamp: "Basecamp — Manali Control",
    checkpoint: "Checkpoint — Balu Ka Ghera",
    hazards: [
      "Sudden snowfall pattern detected near pass crossing — reroute suggested.",
      "River crossing at Rani Nallah running high from glacial melt.",
      "Temperature swing of 18°C forecast between valley and pass today.",
    ],
  },
];

const TREKKER_NAMES = ["Rahul K.", "Priya S.", "Devika M.", "Arjun T.", "Meera J.", "Kabir N.", "Ishaan V.", "Sana R.", "Farah I.", "Nikhil D."];

let currentTrail = null;
let currentNetwork = null;
let hazardTimer = null;
let sosActive = false;
let opsData = [];
let opsTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  renderTrailList();
  wireModeSwitch();
  wireNav();
  wireChat();
  wireSOS();
  generateOpsData();
  renderOpsTable();
  opsTimer = setInterval(tickOpsData, 3200);
});

function renderTrailList() {
  const list = document.getElementById("trailList");
  list.innerHTML = "";

  TRAILS.forEach((t) => {
    const card = document.createElement("button");
    card.className = "trail-card";
    card.innerHTML = `
      <div class="trail-card-top">
        <span class="trail-card-name">${t.name}</span>
        <span class="diff-tag diff-${t.difficulty}">${t.difficulty}</span>
      </div>
      <div class="trail-card-state">${t.state}</div>
      <div class="trail-card-meta">
        <span>ELEV <b>${t.elevation}m</b></span>
        <span>DIST <b>${t.distanceKm}km</b></span>
        <span>${t.coord}</span>
      </div>
    `;
    card.addEventListener("click", () => selectTrail(t.id));
    list.appendChild(card);
  });
}

function selectTrail(id) {
  currentTrail = TRAILS.find((t) => t.id === id);
  currentNetwork = generateNetwork(currentTrail);

  showScreen("pairing");
  document.getElementById("phoneNav").hidden = true;

  const statusEl = document.getElementById("pairingStatus");
  const subEl = document.getElementById("pairingSub");
  statusEl.textContent = "Searching for Echo-Pod…";
  subEl.textContent = `Trail: ${currentTrail.name}`;

  setTimeout(() => {
    statusEl.textContent = `Found Echo-Pod #${Math.floor(1000 + Math.random() * 8999)}`;
  }, 1100);
  setTimeout(() => {
    statusEl.textContent = "Pairing…";
  }, 2000);
  setTimeout(() => {
    statusEl.textContent = "Paired. Joining mesh…";
  }, 2700);
  setTimeout(() => {
    enterDashboard();
  }, 3600);
}

function enterDashboard() {
  document.getElementById("phoneNav").hidden = false;
  populateDashboard();
  populateChatWelcome();
  startHazardRotation();
  showScreen("dashboard");
  setNavActive("dashboard");
}

function generateNetwork(trail) {
  const chainLength = 2 + Math.floor(Math.random() * 2);
  const names = shuffle([...TREKKER_NAMES]).slice(0, chainLength + 2);

  const you = { id: "you", type: "you", name: "You", battery: 86 };
  const chain = [];
  for (let i = 0; i < chainLength; i++) {
    chain.push({
      id: `node-${i + 1}`,
      type: "trekker",
      name: names[i],
      battery: 40 + Math.floor(Math.random() * 55),
      status: "active",
    });
  }
  const hub = { id: "hub", type: "hub", name: trail.checkpoint, battery: 91, status: "active" };
  const base = { id: "base", type: "base", name: trail.basecamp, battery: 100, status: "active" };

  const extraCount = Math.random() < 0.6 ? 1 : 2;
  const extra = [];
  for (let i = 0; i < extraCount; i++) {
    extra.push({
      id: `peer-${i + 1}`,
      type: "trekker",
      name: names[chainLength + i] || `Trekker ${i + 1}`,
      battery: 35 + Math.floor(Math.random() * 60),
      status: "active",
      attachTo: chain[Math.floor(Math.random() * chain.length)].id,
    });
  }

  return { you, chain, hub, base, extra, coverageRadiusKm: +((chain.length + extra.length + 1) * 1.1).toFixed(1) };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function populateDashboard() {
  const net = currentNetwork;
  document.getElementById("dashTrailState").textContent = currentTrail.state;
  document.getElementById("dashTrailName").textContent = currentTrail.name;
  document.getElementById("dashElevation").textContent = `${currentTrail.elevation} m`;
  document.getElementById("coordReadout").textContent = currentTrail.coord;

  const totalNodes = net.chain.length + net.extra.length + 1;
  document.getElementById("metricNodes").textContent = totalNodes;
  document.getElementById("metricRadius").textContent = `${net.coverageRadiusKm} km`;
  document.getElementById("metricHops").textContent = `${net.chain.length + 1} hops`;
  document.getElementById("meshStatusValue").textContent = `CONNECTED · ${totalNodes} NODES`;

  drawMesh(document.getElementById("meshMiniSvg"), 320, 200, false);
}

function startHazardRotation() {
  clearInterval(hazardTimer);
  const banner = document.getElementById("hazardBanner");
  const textEl = document.getElementById("hazardText");
  let i = 0;
  const cycle = () => {
    const hazards = currentTrail.hazards;
    textEl.textContent = `HAZARD WARNING — ${hazards[i % hazards.length]}`;
    banner.hidden = false;
    i++;
    setTimeout(() => { banner.hidden = true; }, 6500);
  };
  cycle();
  hazardTimer = setInterval(cycle, 10000);
}

function curvePath(x1, y1, x2, y2, bend) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function drawMesh(svg, W, H, showLabels) {
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const net = currentNetwork;
  const cx = W / 2, cy = H / 2 + (showLabels ? 20 : 10);

  const positions = { you: { x: cx, y: cy } };
  const angleStep = (Math.PI * 1.3) / Math.max(net.chain.length, 1);
  const startAngle = -Math.PI * 0.65;

  net.chain.forEach((n, i) => {
    const r = (Math.min(W, H) / 2 - 30) * ((i + 1) / net.chain.length);
    const a = startAngle + angleStep * i + (Math.random() - 0.5) * 0.15;
    positions[n.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * (H / W) };
  });

  const lastChain = net.chain[net.chain.length - 1];
  const lastPos = positions[lastChain.id];
  const hubAngle = Math.atan2(lastPos.y - cy, lastPos.x - cx) + 0.35;
  const hubR = Math.min(W, H) / 2 - 8;
  positions.hub = { x: cx + Math.cos(hubAngle) * hubR, y: cy + Math.sin(hubAngle) * hubR * (H / W) };

  const baseAngle = hubAngle + 0.5;
  positions.base = { x: Math.max(18, Math.min(W - 18, cx + Math.cos(baseAngle) * (hubR + 26))), y: Math.max(16, Math.min(H - 16, cy + Math.sin(baseAngle) * (hubR + 20) * (H / W))) };

  net.extra.forEach((n, i) => {
    const parent = positions[n.attachTo];
    const a = Math.random() * Math.PI * 2;
    positions[n.id] = { x: parent.x + Math.cos(a) * 26, y: parent.y + Math.sin(a) * 20 };
  });

  const chainIds = ["you", ...net.chain.map((n) => n.id), "hub", "base"];
  const linkGroup = svgEl("g", { class: "links" });
  for (let i = 0; i < chainIds.length - 1; i++) {
    const p1 = positions[chainIds[i]], p2 = positions[chainIds[i + 1]];
    const path = svgEl("path", {
      d: curvePath(p1.x, p1.y, p2.x, p2.y, 14),
      stroke: "#52856A", "stroke-width": 1.4, fill: "none", "stroke-dasharray": "4 4", opacity: 0.85,
    });
    linkGroup.appendChild(path);
  }
  net.extra.forEach((n) => {
    const p1 = positions[n.attachTo], p2 = positions[n.id];
    linkGroup.appendChild(svgEl("path", {
      d: curvePath(p1.x, p1.y, p2.x, p2.y, 8),
      stroke: "#D4CDC3", "stroke-width": 1, fill: "none", "stroke-dasharray": "2 3", opacity: 0.7,
    }));
  });
  svg.appendChild(linkGroup);

  const drawNode = (id, label, color, r, type) => {
    const p = positions[id];
    const g = svgEl("g", {});
    const pulse = svgEl("circle", { cx: p.x, cy: p.y, r, fill: "none", stroke: color, "stroke-width": 1, opacity: 0.55 });
    const anim = svgEl("animate", { attributeName: "r", from: r, to: r + 8, dur: "2.2s", repeatCount: "indefinite" });
    const animOp = svgEl("animate", { attributeName: "opacity", from: 0.55, to: 0, dur: "2.2s", repeatCount: "indefinite" });
    pulse.appendChild(anim);
    pulse.appendChild(animOp);
    g.appendChild(pulse);
    g.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r, fill: color }));
    if (showLabels) {
      const t = svgEl("text", { x: p.x, y: p.y + r + 11, "text-anchor": "middle", fill: "#706A62", "font-size": "7.5", "font-family": "JetBrains Mono, monospace" });
      t.textContent = label;
      g.appendChild(t);
    }
    svg.appendChild(g);
  };

  drawNode("you", "YOU", "#B3851B", 6, "you");
  net.chain.forEach((n) => drawNode(n.id, n.name.split(" ")[0], "#2D5C43", 4.5, "trekker"));
  net.extra.forEach((n) => drawNode(n.id, n.name.split(" ")[0], "#2D5C43", 3.5, "trekker"));
  drawNode("hub", "CHECKPOINT", "#7FA9FF", 5, "hub");
  drawNode("base", "BASECAMP", "#D95338", 5.5, "base");

  return positions;
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = true));
  document.getElementById(`screen-${name}`).hidden = false;
  if (name === "network" && currentNetwork) {
    drawMesh(document.getElementById("networkSvg"), 320, 320, true);
  }
}

function setNavActive(name) {
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.screen === name));
}

function wireNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen(btn.dataset.screen);
      setNavActive(btn.dataset.screen);
    });
  });
}

function wireModeSwitch() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const mode = btn.dataset.mode;
      document.getElementById("view-app").classList.toggle("is-active", mode === "app");
      document.getElementById("view-ops").classList.toggle("is-active", mode === "ops");
    });
  });
}

function populateChatWelcome() {
  const log = document.getElementById("chatLog");
  log.innerHTML = "";
  addChatMessage(`Welcome to the mesh. This channel relays through ${currentNetwork.chain.length + 1} hops to ${currentTrail.basecamp}.`, false, "delivered");
}

function addChatMessage(text, mine, metaState, metaText) {
  const log = document.getElementById("chatLog");
  const wrap = document.createElement("div");
  wrap.className = "chat-msg" + (mine ? " mine" : "");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text;
  const meta = document.createElement("div");
  meta.className = "chat-meta" + (metaState ? " " + metaState : "");
  meta.textContent = metaText || (mine ? "Sending…" : currentTrail.basecamp);
  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
  return meta;
}

function wireChat() {
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSend");
  const send = () => {
    const val = input.value.trim();
    if (!val || !currentTrail) return;
    const meta = addChatMessage(val, true, "relaying", "Sending…");
    input.value = "";
    sendBtn.disabled = true;

    const hopNames = [...currentNetwork.chain.map((n) => n.name), currentNetwork.hub.name];
    let delay = 700;
    hopNames.forEach((name, i) => {
      setTimeout(() => {
        meta.textContent = `Relayed via ${name}`;
      }, delay * (i + 1));
    });
    setTimeout(() => {
      meta.className = "chat-meta delivered";
      meta.textContent = `Delivered to ${currentTrail.basecamp}`;
      sendBtn.disabled = false;
      setTimeout(() => {
        addChatMessage(pickReply(), false, "delivered", currentTrail.basecamp);
      }, 900);
    }, delay * (hopNames.length + 1));
  };
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
}

function pickReply() {
  const replies = [
    "Copy that. Conditions logged, continue as planned.",
    "Received. Weather window looks stable for next 2 hrs.",
    "Noted — checkpoint team standing by if needed.",
    "Copy. Next checkpoint has hot water and shelter.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function wireSOS() {
  document.getElementById("sosButton").addEventListener("click", triggerSOS);
}

function triggerSOS() {
  if (sosActive || !currentTrail) return;
  sosActive = true;
  const btn = document.getElementById("sosButton");
  const logWrap = document.getElementById("sosLog");
  btn.classList.add("is-active");
  logWrap.hidden = false;
  logWrap.innerHTML = "";

  const steps = [
    "SOS broadcast initiated on mesh channel.",
    ...currentNetwork.chain.map((n) => `Relayed via ${n.id.toUpperCase()} — ${n.name}`),
    `Relayed via ${currentNetwork.hub.name}`,
    `Received by ${currentTrail.basecamp}`,
    `Rescue dispatch notified — ETA ${12 + Math.floor(Math.random() * 20)} min`,
  ];

  let t = 0;
  steps.forEach((text, i) => {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = "log-line";
      const secs = (i * 2.4).toFixed(1);
      line.innerHTML = `<span class="log-time">[+${secs}s]</span><span>${text}</span>`;
      logWrap.appendChild(line);
      logWrap.scrollTop = logWrap.scrollHeight;
    }, t);
    t += 900;
  });

  setTimeout(() => {
    const line = document.createElement("div");
    line.className = "log-line";
    line.style.color = "var(--flare)";
    line.innerHTML = `<span class="log-time">—</span><span>SOS Broadcast Active. Tap again to reset.</span>`;
    logWrap.appendChild(line);
    btn.addEventListener("click", resetSOSOnce, { once: true });
  }, t + 400);
}

function resetSOSOnce() {
  sosActive = false;
  document.getElementById("sosButton").classList.remove("is-active");
  document.getElementById("sosLog").hidden = true;
}

function generateOpsData() {
  opsData = [];
  TRAILS.forEach((trail) => {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      opsData.push({
        node: `ND-${(1000 + Math.floor(Math.random() * 8999))}`,
        name: TREKKER_NAMES[Math.floor(Math.random() * TREKKER_NAMES.length)],
        trail: trail.name,
        status: "active",
        battery: 45 + Math.floor(Math.random() * 50),
        lastPing: Math.floor(Math.random() * 30) + 1,
        hops: 1 + Math.floor(Math.random() * 3),
      });
    }
  });
}

function renderOpsTable() {
  const body = document.getElementById("opsTableBody");
  body.innerHTML = "";
  opsData.forEach((row) => {
    const tr = document.createElement("tr");
    const statusClass = row.status === "sos" ? "status-sos" : row.status === "relay" ? "status-relay" : "status-active";
    const statusLabel = row.status === "sos" ? "SOS ACTIVE" : row.status === "relay" ? "Relaying" : "Active";
    tr.innerHTML = `
      <td class="mono">${row.node}</td>
      <td>${row.name}</td>
      <td>${row.trail}</td>
      <td><span class="status-chip ${statusClass}">${statusLabel}</span></td>
      <td>
        <div class="batt-bar-wrap">
          <div class="batt-bar"><div class="batt-fill" style="width:${row.battery}%"></div></div>
          <span class="mono">${row.battery}%</span>
        </div>
      </td>
      <td class="mono">${row.lastPing}s ago</td>
      <td class="mono">${row.hops}</td>
    `;
    body.appendChild(tr);
  });

  const total = opsData.length;
  const sosCount = opsData.filter((r) => r.status === "sos").length;
  const trailsLive = new Set(opsData.map((r) => r.trail)).size;
  document.getElementById("opsSummary").innerHTML = `
    <span class="pill"><b>${total}</b> nodes online</span>
    <span class="pill"><b>${trailsLive}</b> trails active</span>
    <span class="pill"><b style="color:${sosCount ? 'var(--flare)' : 'var(--signal)'}">${sosCount}</b> SOS alerts</span>
  `;
}

function tickOpsData() {
  if (!opsData.length) return;
  const idx = Math.floor(Math.random() * opsData.length);
  const row = opsData[idx];
  row.lastPing = Math.floor(Math.random() * 8) + 1;
  row.battery = Math.max(10, row.battery - (Math.random() < 0.3 ? 1 : 0));
  const roll = Math.random();
  row.status = roll < 0.08 ? "sos" : roll < 0.22 ? "relay" : "active";
  renderOpsTable();
}
