const STORAGE_KEY = 'camino-a-mordor-progreso';

let state = null;

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function defaultState() {
  return { strideMeters: 0.75, history: {}, startDate: todayKey(), reachedDates: {} };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('No se pudo leer el progreso guardado', e);
  }
  return defaultState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('No se pudo guardar el progreso', e);
    return false;
  }
}

function totalSteps() {
  return Object.values(state.history).reduce((sum, s) => sum + s, 0);
}

function totalKm() {
  return Math.min(totalSteps() * (state.strideMeters / 1000), TOTAL_KM);
}

function currentStageIndex(km) {
  let idx = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (km >= MILESTONES[i].km) idx = i;
  }
  return idx;
}

function currentStreak() {
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = todayKey(cursor);
    if (state.history[key] && state.history[key] > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function dailyPoolForKm(km) {
  if (km < MILESTONES.find(m => m.id === 'rivendel').km) return DAILY_POOLS.inicio;
  if (km < MILESTONES.find(m => m.id === 'amon_hen').km) return DAILY_POOLS.comunidad;
  if (km < MILESTONES.find(m => m.id === 'minas_morgul').km) return DAILY_POOLS.dosCaminantes;
  return DAILY_POOLS.sombra;
}

function syncAchievements(km) {
  let changed = false;
  MILESTONES.forEach(m => {
    if (km >= m.km && !state.reachedDates[m.id]) {
      state.reachedDates[m.id] = todayKey();
      changed = true;
    }
  });
  if (changed) saveState();
}

function buildMapPoints() {
  const w = 1500, h = 620, margin = 60;
  const n = MILESTONES.length;
  const points = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = margin + t * (w - margin * 2);
    const wobble = Math.sin(i * 1.3) * 90;
    const y = 120 + t * (h - 240) + wobble;
    points.push({ x, y });
  }
  return points;
}

function renderMap(km, company) {
  const svg = document.getElementById('mapSvg');
  const points = buildMapPoints();
  const stageIdx = currentStageIndex(km);

  const fullPath = 'M ' + points.map(p => `${p.x} ${p.y}`).join(' L ');

  const doneFrac = TOTAL_KM > 0 ? km / TOTAL_KM : 0;
  const doneCount = doneFrac * (points.length - 1);
  const doneFullIdx = Math.floor(doneCount);
  const doneRemainder = doneCount - doneFullIdx;

  let donePoints = points.slice(0, doneFullIdx + 1);
  let markerX, markerY;
  if (doneFullIdx < points.length - 1) {
    const a = points[doneFullIdx], b = points[doneFullIdx + 1];
    markerX = a.x + (b.x - a.x) * doneRemainder;
    markerY = a.y + (b.y - a.y) * doneRemainder;
    donePoints.push({ x: markerX, y: markerY });
  } else {
    markerX = points[points.length - 1].x;
    markerY = points[points.length - 1].y;
  }

  const donePath = 'M ' + donePoints.map(p => `${p.x} ${p.y}`).join(' L ');

  let svgContent = `<path class="trail-path" d="${fullPath}"></path>`;
  svgContent += `<path class="trail-path-done" d="${donePath}"></path>`;

  MILESTONES.forEach((m, i) => {
    const p = points[i];
    const reached = km >= m.km;
    const isCurrent = i === stageIdx;
    const cls = isCurrent ? 'current' : (reached ? 'reached' : '');
    const angle = i % 2 === 0 ? -28 : 28;
    const labelY = i % 2 === 0 ? p.y - 12 : p.y + 22;
    svgContent += `<circle class="milestone-dot ${cls}" cx="${p.x}" cy="${p.y}" r="7"></circle>`;
    svgContent += `<text class="milestone-label" x="${p.x}" y="${labelY}" text-anchor="middle" transform="rotate(${angle} ${p.x} ${labelY})">${m.name}</text>`;
  });

  const shown = company.slice(0, 5);
  shown.forEach((key, i) => {
    const c = CHAR[key];
    svgContent += `<text class="party-icon" x="${markerX - 12 + i * 14}" y="${markerY + 6}">${c.emoji}</text>`;
  });
  if (company.length > 5) {
    svgContent += `<text class="party-icon" x="${markerX - 12 + 5 * 14}" y="${markerY + 6}" font-size="14">+${company.length - 5}</text>`;
  }

  svgContent += `<text class="party-icon" x="${points[points.length - 1].x - 12}" y="${points[points.length - 1].y - 22}">🌋</text>`;

  svg.innerHTML = svgContent;
}

function renderScene(stage) {
  const card = document.getElementById('sceneCard');
  card.className = 'scene-card region-' + stage.region;
  document.getElementById('sceneIcon').textContent = stage.icon;
  document.getElementById('sceneName').textContent = stage.name;
  document.getElementById('sceneKm').textContent = stage.km + ' km desde La Comarca';
  document.getElementById('sceneText').textContent = stage.scene;

  const row = document.getElementById('companyRow');
  row.innerHTML = '';
  stage.company.forEach(key => {
    const c = CHAR[key];
    const chip = document.createElement('div');
    chip.className = 'company-chip' + (key === 'jorge' ? ' you' : '');
    chip.innerHTML = `<span>${c.emoji}</span><span>${c.name}</span>`;
    row.appendChild(chip);
  });
}

function renderTimeline(km) {
  const list = document.getElementById('timelineList');
  list.innerHTML = '';
  MILESTONES.forEach(m => {
    const reached = km >= m.km;
    const li = document.createElement('li');
    li.className = reached ? 'reached' : 'pending';
    li.innerHTML = `<span class="mark">${reached ? '✓' : '·'}</span><span class="name">${m.name}</span><span class="km">${m.km} km</span>`;
    list.appendChild(li);
  });
}

function renderAchievements() {
  const list = document.getElementById('achievementsList');
  list.innerHTML = '';
  MILESTONES.forEach(m => {
    const date = state.reachedDates[m.id];
    const li = document.createElement('li');
    li.className = date ? 'unlocked' : 'locked';
    li.innerHTML = `<span class="ach-title"><span class="ach-trophy">${date ? '🏆' : '🔒'}</span>${m.achievement}</span>` +
      (date ? `<span class="ach-date">Conseguido el ${date}</span>` : '');
    list.appendChild(li);
  });
}

function renderHistory() {
  const body = document.getElementById('historyBody');
  body.innerHTML = '';
  const entries = Object.entries(state.history).sort((a, b) => b[0].localeCompare(a[0]));
  entries.forEach(([date, steps]) => {
    const km = (steps * state.strideMeters / 1000).toFixed(2);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${date}</td><td>${steps}</td><td>${km}</td>`;
    body.appendChild(tr);
  });
}

function renderVictory(km) {
  const banner = document.getElementById('victoryBanner');
  if (km >= TOTAL_KM) {
    const days = Object.keys(state.history).length;
    const arrival = todayKey();
    banner.innerHTML = `
      <div class="victory">
        <h2>🌋 El Anillo ha sido destruido 🌋</h2>
        <p>Frodo, Sam y Jorge habéis completado los ${TOTAL_KM} km del camino hasta el Monte del Destino.</p>
        <div class="victory-stats">
          <div class="victory-stat"><div class="v-value">${days}</div><div class="v-label">días caminados</div></div>
          <div class="victory-stat"><div class="v-value">${totalSteps().toLocaleString('es-ES')}</div><div class="v-label">pasos totales</div></div>
          <div class="victory-stat"><div class="v-value">${km.toFixed(1)} km</div><div class="v-label">distancia recorrida</div></div>
          <div class="victory-stat"><div class="v-value">${state.startDate}</div><div class="v-label">fecha de inicio</div></div>
          <div class="victory-stat"><div class="v-value">${arrival}</div><div class="v-label">fecha de llegada</div></div>
        </div>
      </div>`;
  } else {
    banner.innerHTML = '';
  }
}

function render() {
  const km = totalKm();
  const stageIdx = currentStageIndex(km);
  const stage = MILESTONES[stageIdx];
  const nextStage = MILESTONES[stageIdx + 1];
  const pct = Math.min(100, (km / TOTAL_KM) * 100);
  const dayNumber = daysBetween(state.startDate, todayKey());

  document.getElementById('stageBadge').textContent = `Estás en: ${stage.name}`;
  document.getElementById('statKm').textContent = km.toFixed(2) + ' km';
  document.getElementById('statTotal').textContent = TOTAL_KM + ' km';
  document.getElementById('statSteps').textContent = totalSteps().toLocaleString('es-ES');
  document.getElementById('statDays').textContent = Object.keys(state.history).length;
  document.getElementById('statStreak').textContent = currentStreak() + ' días';
  document.getElementById('progressBar').style.width = pct.toFixed(1) + '%';

  const remaining = nextStage ? (nextStage.km - km).toFixed(1) : 0;
  document.getElementById('progressCaption').textContent = nextStage
    ? `${pct.toFixed(1)}% recorrido · faltan ${remaining} km para ${nextStage.name}`
    : `${pct.toFixed(1)}% recorrido · has llegado al final`;

  const pool = dailyPoolForKm(km);
  document.getElementById('dailyTag').textContent = `DÍA ${Math.max(dayNumber + 1, 1)} DEL VIAJE`;
  document.getElementById('dailyText').textContent = pool[dayNumber % pool.length];

  document.getElementById('strideInput').value = state.strideMeters;

  renderMap(km, stage.company);
  renderScene(stage);
  renderTimeline(km);
  renderAchievements();
  renderHistory();
  renderVictory(km);
}

document.getElementById('dateInput').addEventListener('change', (e) => {
  const date = e.target.value;
  const stepsInput = document.getElementById('stepsInput');
  stepsInput.value = state.history[date] || '';
});

document.getElementById('entryForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const dateInput = document.getElementById('dateInput');
  const stepsInput = document.getElementById('stepsInput');
  const date = dateInput.value;
  const steps = parseInt(stepsInput.value, 10);
  const feedback = document.getElementById('entryFeedback');
  if (!date) {
    feedback.textContent = 'Elige una fecha.';
    return;
  }
  if (!steps || steps < 0) {
    feedback.textContent = 'Introduce un número de pasos válido.';
    return;
  }
  state.history[date] = steps;
  if (saveState()) {
    syncAchievements(totalKm());
    feedback.textContent = `Pasos registrados para el ${date}.`;
    dateInput.value = todayKey();
    stepsInput.value = '';
    render();
  } else {
    feedback.textContent = 'No se pudo guardar el progreso.';
  }
});

document.getElementById('saveStrideBtn').addEventListener('click', () => {
  const val = parseFloat(document.getElementById('strideInput').value);
  if (val && val > 0) {
    state.strideMeters = val;
    saveState();
    syncAchievements(totalKm());
    render();
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('¿Reiniciar todo el viaje? Se perderá el progreso registrado.')) return;
  state = { strideMeters: state.strideMeters, history: {}, startDate: todayKey(), reachedDates: {} };
  saveState();
  render();
});

state = loadState();
if (!state.startDate) state.startDate = todayKey();
if (!state.reachedDates) state.reachedDates = {};
syncAchievements(totalKm());
document.getElementById('appVersion').textContent = APP_VERSION;
document.getElementById('dateInput').value = todayKey();
document.getElementById('dateInput').max = todayKey();
render();
