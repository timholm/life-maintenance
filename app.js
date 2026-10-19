/* The Life Maintenance Guide — app logic. Pure JS, localStorage persistence. */
"use strict";

var LS_KEY = "lifeMaintenanceV1";

var PILLARS = [
  { id: "sleep",       name: "Sleep",          sub: "7–9 hours",            icon: "🌙", cls: "sage"  },
  { id: "water",       name: "Water",          sub: "Hydration",              icon: "💧", cls: "slate" },
  { id: "bills",       name: "Bills",          sub: "Due dates",              icon: "🧾", cls: "slate" },
  { id: "appointments",name: "Appointments",   sub: "Booking / Keeping",      icon: "📅", cls: "gold"  },
  { id: "callbacks",   name: "Call-Backs",     sub: "Replying to people",     icon: "📞", cls: "gold"  },
  { id: "filters",     name: "Filters",        sub: "HVAC / Water",           icon: "🔧", cls: "terra" },
  { id: "expirations", name: "Expirations",    sub: "Food, Meds, Cosmetics",  icon: "⏳", cls: "terra" },
  { id: "rest",        name: "Guilt-Free Rest",sub: "Pause without shame",    icon: "🌿", cls: "sage"  }
];

var FREQS = ["daily", "weekly", "monthly", "seasonal"];
var FREQ_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", seasonal: "Seasonal" };

/* [pillar, freq, text] */
var DEFAULT_TASKS = [
  ["sleep","daily","Sleep 7–9 hours"],
  ["sleep","daily","Screens off 30 min before bed"],
  ["sleep","daily","Set alarm"],
  ["sleep","weekly","Keep a consistent bedtime"],
  ["sleep","seasonal","Replace pillow if flat"],

  ["water","daily","Drink water before coffee"],
  ["water","daily","Refill water bottle"],
  ["water","daily","Hydrate during the day"],
  ["water","weekly","Clean water bottle"],

  ["bills","weekly","Check bank balance"],
  ["bills","weekly","Pay weekly bills"],
  ["bills","monthly","Pay rent / mortgage / credit cards"],
  ["bills","monthly","Transfer to savings"],
  ["bills","monthly","Review statements"],
  ["bills","monthly","Audit subscriptions"],
  ["bills","monthly","Check credit score"],
  ["bills","seasonal","File taxes"],
  ["bills","seasonal","Review insurance"],

  ["appointments","daily","Check calendar"],
  ["appointments","weekly","Confirm upcoming appointments"],
  ["appointments","seasonal","Book doctor / dentist / eye exams"],
  ["appointments","seasonal","Vaccines / boosters"],

  ["callbacks","daily","Reply to one overdue message"],
  ["callbacks","weekly","Call or text family or friend"],
  ["callbacks","weekly","Check on a friend"],
  ["callbacks","monthly","Send birthday messages"],
  ["callbacks","monthly","Thank someone"],

  ["filters","monthly","Change air filter"],
  ["filters","monthly","Clean coffee maker / descale kettle"],
  ["filters","seasonal","HVAC service"],
  ["filters","seasonal","Replace water filter"],

  ["expirations","weekly","Fridge cleanout"],
  ["expirations","monthly","Check expirations (food, meds, cosmetics)"],
  ["expirations","seasonal","Emergency kit check"],
  ["expirations","seasonal","Seasonal clothes switch"],

  ["rest","daily","20-20-20 eye breaks"],
  ["rest","daily","Pause and breathe"],
  ["rest","weekly","Emotional check-in"],
  ["rest","weekly","Guilt-free downtime"],
  ["rest","monthly","Review goals / budget / relationships"]
];

var state = { tasks: [], expanded: {}, tab: "pillars" };

function defaultTasks() {
  return DEFAULT_TASKS.map(function (t, i) {
    return { id: "d" + i, pillar: t[0], freq: t[1], text: t[2], done: false, custom: false };
  });
}

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ tasks: state.tasks })); } catch (e) {}
}

function load() {
  var tasks = null;
  try { tasks = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
  if (tasks && tasks.tasks && tasks.tasks.length) {
    state.tasks = tasks.tasks;
  } else {
    state.tasks = defaultTasks();
  }
}

function pillarById(id) {
  for (var i = 0; i < PILLARS.length; i++) if (PILLARS[i].id === id) return PILLARS[i];
  return null;
}

function pillarStats(pid) {
  var ts = state.tasks.filter(function (t) { return t.pillar === pid; });
  var done = ts.filter(function (t) { return t.done; }).length;
  var pct = ts.length ? Math.round(done / ts.length * 100) : 100;
  var status = pct >= 70 ? "ok" : (pct >= 40 ? "warn" : "crit");
  return { total: ts.length, done: done, pct: pct, status: status };
}

function overallPct() {
  var done = state.tasks.filter(function (t) { return t.done; }).length;
  return state.tasks.length ? Math.round(done / state.tasks.length * 100) : 100;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function taskRow(t) {
  var cls = t.done ? "task done" : "task";
  return '<div class="' + cls + '" data-id="' + t.id + '">' +
    '<input type="checkbox"' + (t.done ? " checked" : "") + ' aria-label="done">' +
    '<span class="txt">' + esc(t.text) + "</span>" +
    '<button class="del" title="Delete task">×</button></div>';
}

/* ---------- Views ---------- */

function renderPillars() {
  var el = document.getElementById("view-pillars");
  var html = "";
  PILLARS.forEach(function (p) {
    var s = pillarStats(p.id);
    var dotCls = s.status === "ok" ? "dot ok" : (s.status === "warn" ? "dot warn" : "dot");
    html += '<div class="pillar ' + p.cls + '" data-pillar="' + p.id + '">' +
      '<div class="' + dotCls + '"></div>' +
      '<div class="icon">' + p.icon + "</div>" +
      "<h3>" + esc(p.name) + "</h3>" +
      '<div class="psub">' + esc(p.sub) + "</div>" +
      '<div class="bar"><i style="width:' + s.pct + '%"></i></div>' +
      '<div class="pct">' + s.done + "/" + s.total + " · " + s.pct + "%</div>";
    if (state.expanded[p.id]) {
      html += '<div class="tasks">';
      FREQS.forEach(function (f) {
        var ts = state.tasks.filter(function (t) { return t.pillar === p.id && t.freq === f; });
        if (!ts.length) return;
        html += '<div class="freq-label">' + FREQ_LABEL[f] + "</div>";
        ts.forEach(function (t) { html += taskRow(t); });
      });
      html += "</div>";
    }
    html += "</div>";
  });
  el.innerHTML = html;
}

function renderFreqView(freq) {
  var el = document.getElementById("view-tasks");
  var ts = state.tasks.filter(function (t) { return t.freq === freq; });
  if (!ts.length) { el.innerHTML = '<p style="color:var(--muted)">No tasks here yet. Add one below.</p>'; return; }
  var html = "";
  PILLARS.forEach(function (p) {
    var pts = ts.filter(function (t) { return t.pillar === p.id; });
    if (!pts.length) return;
    html += '<div class="freq-group"><h3>' + p.icon + " " + esc(p.name) + "</h3>";
    pts.forEach(function (t) { html += taskRow(t); });
    html += "</div>";
  });
  el.innerHTML = html;
}

function renderMeter() {
  var pct = overallPct();
  var load = 100 - pct; // mental load = incomplete share
  document.getElementById("meterFill").style.width = pct + "%";
  document.getElementById("meterPct").textContent = pct + "%";
  var st = document.getElementById("meterStatus");
  st.classList.remove("critical");
  if (pct >= 85)      st.textContent = "All systems nominal. Rest without feeling lazy.";
  else if (pct >= 60) st.textContent = "Load: normal. A few background processes need attention.";
  else if (pct >= 35) st.textContent = "Load: elevated. Small tasks are compounding — knock out a few.";
  else {
    st.textContent = "Load: CRITICAL. You are approaching System Crash / Paralysis. Do one tiny thing now.";
    st.classList.add("critical");
  }
}

function render() {
  renderMeter();
  var pv = document.getElementById("view-pillars");
  var tv = document.getElementById("view-tasks");
  if (state.tab === "pillars") {
    pv.classList.remove("hidden"); tv.classList.add("hidden");
    renderPillars();
  } else {
    pv.classList.add("hidden"); tv.classList.remove("hidden");
    renderFreqView(state.tab);
  }
}

/* ---------- Events (delegation) ---------- */

document.addEventListener("click", function (e) {
  var row = e.target.closest(".task");
  if (row) {
    var id = row.getAttribute("data-id");
    if (e.target.classList.contains("del")) {
      state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
      save(); render(); return;
    }
    if (e.target.type === "checkbox") {
      var t = state.tasks.filter(function (x) { return x.id === id; })[0];
      if (t) { t.done = e.target.checked; save(); render(); }
      return;
    }
  }
  var pillar = e.target.closest(".pillar");
  if (pillar && !e.target.closest(".task")) {
    var pid = pillar.getAttribute("data-pillar");
    state.expanded[pid] = !state.expanded[pid];
    renderPillars();
  }
});

document.getElementById("tabs").addEventListener("click", function (e) {
  var b = e.target.closest("button");
  if (!b) return;
  var btns = this.querySelectorAll("button");
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
  b.classList.add("active");
  state.tab = b.getAttribute("data-tab");
  render();
});

function addTask() {
  var text = document.getElementById("newText").value.trim();
  if (!text) return;
  state.tasks.push({
    id: "c" + Date.now().toString(36),
    pillar: document.getElementById("newPillar").value,
    freq: document.getElementById("newFreq").value,
    text: text, done: false, custom: true
  });
  document.getElementById("newText").value = "";
  save(); render();
}
document.getElementById("addBtn").addEventListener("click", addTask);
document.getElementById("newText").addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTask();
});

document.getElementById("resetBtn").addEventListener("click", function () {
  if (confirm("Reset all tasks to defaults? Your custom tasks will be removed.")) {
    state.tasks = defaultTasks();
    save(); render();
  }
});

/* ---------- Init ---------- */
(function init() {
  load();
  var sel = document.getElementById("newPillar");
  PILLARS.forEach(function (p) {
    var o = document.createElement("option");
    o.value = p.id; o.textContent = p.icon + " " + p.name;
    sel.appendChild(o);
  });
  render();
})();
