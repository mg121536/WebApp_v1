// calibration.js

let sinMax = 2000;
let sinMin = -2000;
let cosMax = 2000;
let cosMin = -2000;
let hoverTarget = null;

const VALUE_MAX = 5000;
const VALUE_MIN = -5000;
const VALUE_RANGE = VALUE_MAX - VALUE_MIN;
const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ■ [Event] 初期化
function toCanvasY(value) {
  return HEIGHT - ((value - VALUE_MIN) / VALUE_RANGE) * HEIGHT;
}

// ■ [Event] 初期化
function toValueY(y) {
  return ((HEIGHT - y) / HEIGHT) * VALUE_RANGE + VALUE_MIN;
}

// ■ [Event] 初期化
function toCanvasX(deg) {
  return (deg / 360) * WIDTH;
}

// ■ [Event] 初期化
function drawLabel(yCanvas, value, color) {
  const label = `${value} mV`;
  ctx.font = "12px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.shadowColor = "#aaa";
  ctx.shadowBlur = 2;

  const textWidth = ctx.measureText(label).width;
  const x = WIDTH - textWidth - 10;
  const y = yCanvas;

  ctx.fillStyle = "#fff";
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 10, textWidth + 10, 20, 5); // 吹き出し
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillText(label, x, y);

  ctx.shadowBlur = 0;
}

// ■ [Event] 初期化
function drawWaveform() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Y=0基準線
  drawGrid(); 
  ctx.strokeStyle = "#ccc";
  ctx.beginPath();
  ctx.moveTo(0, toCanvasY(0));
  ctx.lineTo(WIDTH, toCanvasY(0));
  ctx.stroke();

  // SIN 波描画（+ ラベル）
  drawSignal(sinMin, sinMax, 0, "red");
  if (hoverTarget === "sinMax") drawLabel(toCanvasY(sinMax), sinMax, "red");
  if (hoverTarget === "sinMin") drawLabel(toCanvasY(sinMin), sinMin, "red");
  // SIN中心線ラベル
  if (hoverTarget === "sinCenter") {
    const center = (sinMax + sinMin) / 2;
    drawLabel(toCanvasY(center), center, "red");
  }

  // COS 波描画（+ ラベル）
  drawSignal(cosMin, cosMax, 90, "blue");
  if (hoverTarget === "cosMax") drawLabel(toCanvasY(cosMax), cosMax, "blue");
  if (hoverTarget === "cosMin") drawLabel(toCanvasY(cosMin), cosMin, "blue");
  // COS中心線ラベル
  if (hoverTarget === "cosCenter") {
    const center = (cosMax + cosMin) / 2;
    drawLabel(toCanvasY(center), center, "blue");
  }
  drawYAxisMarkers();
}

// ■ 背景グリッド描画
function drawGrid() {
  const xSteps = 12; // 30度ごと
  const ySteps = 10; // mV 1000単位で分割
  const stepX = canvas.width / xSteps;
  const stepY = canvas.height / ySteps;

  ctx.save();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  // 縦線（角度）
  for (let i = 0; i <= xSteps; i++) {
    const x = i * stepX;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // 横線（電圧）
  for (let i = 0; i <= ySteps; i++) {
    const y = i * stepY;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

// ■ [Event] 初期化
function drawYAxisMarkers() {
  const steps = 5; // 例: 5分割（5000, 2500, 0, -2500, -5000）
  const stepVal = (VALUE_MAX - VALUE_MIN) / steps;
  ctx.save();
  ctx.font = "10px sans-serif";
  ctx.fillStyle = "#888";
  ctx.strokeStyle = "#ccc";
  ctx.setLineDash([3, 3]);
  for (let i = 0; i <= steps; i++) {
    const val = VALUE_MIN + i * stepVal;
    const y = toCanvasY(val);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillText(`${val.toFixed(0)} mV`, canvas.width - 50, y - 2);
  }
  ctx.restore();
}

// ■ 波形描画
function drawSignal(max, min, phaseDeg, color, label) {
  const center = (max + min) / 2;
  const amplitudeTop = max - center;
  const amplitudeBottom = center - min;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  for (let deg = 0; deg <= 360; deg += 1) {  // ステップを 5→1 にして滑らかに
    const rad = (deg + phaseDeg) * Math.PI / 180;
    const sinVal = Math.sin(rad);
    const value = sinVal >= 0 ? center + sinVal * amplitudeTop : center + sinVal * amplitudeBottom;

    const x = toCanvasX(deg);
    const y = toCanvasY(value);

    if (deg === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();

  // 中心線（破線）
  ctx.save();
  ctx.strokeStyle = color;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const yCenter = toCanvasY(center);
  ctx.moveTo(0, yCenter);
  ctx.lineTo(canvas.width, yCenter);
  ctx.stroke();
  ctx.restore();
}


// ■ [Event] 初期化
function updateWaveform() {
  sinMax = parseInt(document.getElementById('sinMax').value);
  sinMin = parseInt(document.getElementById('sinMin').value);
  cosMax = parseInt(document.getElementById('cosMax').value);
  cosMin = parseInt(document.getElementById('cosMin').value);

  document.getElementById('sinMaxLabel').textContent = sinMax;
  document.getElementById('sinMinLabel').textContent = sinMin;
  document.getElementById('cosMaxLabel').textContent = cosMax;
  document.getElementById('cosMinLabel').textContent = cosMin;

  drawWaveform();
}

// ■ [Event] 初期化
function addSyncBehavior(rangeId, inputId, callback) {
  const range = document.getElementById(rangeId);
  const input = document.getElementById(inputId);
  if (!range || !input) return;

  range.addEventListener('input', () => {
    input.value = range.value;
    callback();
  });
  input.addEventListener('input', () => {
    range.value = input.value;
    callback();
  });
}

// 設定保存・初期化・復元
const settingIds = [
  'sinMax', 'sinMin', 'cosMax', 'cosMin',
  'sin_max_input', 'sin_min_input', 'cos_max_input', 'cos_min_input',
  'sin_acquired_max_input', 'sin_acquired_min_input',
  'cos_acquired_max_input', 'cos_acquired_min_input',
  'polePairs'
];

// ■ [Event] 初期化
function saveSettings() {
  const settings = {};
  settingIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) settings[id] = el.value;
  });
  localStorage.setItem('encoderSettings', JSON.stringify(settings));
  alert('設定を保存しました。');
}

// ■ [Event] 初期化
function resetSettings() {
  localStorage.removeItem('encoderSettings');
  location.reload();
}

// ■ [Event] 初期化
function restoreSettings() {
  const saved = localStorage.getItem('encoderSettings');
  if (!saved) return;

  const settings = JSON.parse(saved);
  settingIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && settings[id] !== undefined) {
      el.value = settings[id];
    }
  });

  updateWaveform();
}

document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
document.getElementById('resetSettings')?.addEventListener('click', resetSettings);
window.addEventListener('DOMContentLoaded', () => {
  restoreSettings();
  updateWaveform();
});

// 同期設定
addSyncBehavior('sinMax', 'sin_max_input', updateWaveform);
addSyncBehavior('sinMin', 'sin_min_input', updateWaveform);
addSyncBehavior('cosMax', 'cos_max_input', updateWaveform);
addSyncBehavior('cosMin', 'cos_min_input', updateWaveform);
addSyncBehavior('sin_acquired_max', 'sin_acquired_max_input', () => {});
addSyncBehavior('sin_acquired_min', 'sin_acquired_min_input', () => {});
addSyncBehavior('cos_acquired_max', 'cos_acquired_max_input', () => {});
addSyncBehavior('cos_acquired_min', 'cos_acquired_min_input', () => {});

// ==== Canvasドラッグ対応 ====
let draggingTarget = null;

canvas.addEventListener("mousedown", (e) => {
  const y = e.offsetY;
  const pairs = [
    { key: "sinMax", val: sinMax, color: "red" },
    { key: "sinMin", val: sinMin, color: "red" },
    { key: "sinCenter", val: (sinMax + sinMin) / 2 },
    { key: "cosMax", val: cosMax, color: "blue" },
    { key: "cosMin", val: cosMin, color: "blue" },
    { key: "cosCenter", val: (cosMax + cosMin) / 2 }
  ];

  for (const p of pairs) {
    if (Math.abs(y - toCanvasY(p.val)) < 5) {
      draggingTarget = p.key;
      return;
    }
  }
});

// ■ [Event] 初期化
canvas.addEventListener("mousemove", (e) => {
  const y = e.offsetY;

  if (draggingTarget) {
    const val = toValueY(y);
    switch (draggingTarget) {
      case "sinMax": sinMax = Math.max(val, sinMin + 1); break;
      case "sinMin": sinMin = Math.min(val, sinMax - 1); break;
      case "cosMax": cosMax = Math.max(val, cosMin + 1); break;
      case "cosMin": cosMin = Math.min(val, cosMax - 1); break;
      case "sinCenter": {
        const center = val;
        const half = (sinMax - sinMin) / 2;
        sinMax = center + half;
        sinMin = center - half;
        break;
      }
      case "cosCenter": {
        const center = val;
        const half = (cosMax - cosMin) / 2;
        cosMax = center + half;
        cosMin = center - half;
        break;
  }
    }
    document.getElementById("sinMax").value = sinMax;
    document.getElementById("sinMin").value = sinMin;
    document.getElementById("cosMax").value = cosMax;
    document.getElementById("cosMin").value = cosMin;

    document.getElementById("sin_max_input").value = sinMax;
    document.getElementById("sin_min_input").value = sinMin;
    document.getElementById("cos_max_input").value = cosMax;
    document.getElementById("cos_min_input").value = cosMin;

    updateWaveform();
  } else {

    const candidates = [
      { key: "sinMax", val: sinMax },
      { key: "sinMin", val: sinMin },
      { key: "sinCenter", val: (sinMax + sinMin) / 2 },
      { key: "cosMax", val: cosMax },
      { key: "cosMin", val: cosMin },
      { key: "cosCenter", val: (cosMax + cosMin) / 2 }
    ];
    const near = candidates.find(c => Math.abs(y - toCanvasY(c.val)) < 5);
    hoverTarget = near ? near.key : null;
    canvas.style.cursor = hoverTarget ? "ns-resize" : "default";
    drawWaveform();
  }
});

// ■ [Event] 初期化
canvas.addEventListener("mouseup", () => {
  draggingTarget = null;
});

// ■ [Event] 初期化
canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const y = touch.clientY - rect.top;

  const pairs = [
    { key: "sinMax", val: sinMax },
    { key: "sinMin", val: sinMin },
    { key: "sinCenter", val: (sinMax + sinMin) / 2 },
    { key: "cosMax", val: cosMax },
    { key: "cosMin", val: cosMin },
    { key: "cosCenter", val: (cosMax + cosMin) / 2 }
  ];

  for (const p of pairs) {
    if (Math.abs(y - toCanvasY(p.val)) < 10) {
      draggingTarget = p.key;
      e.preventDefault();
      return;
    }
  }
}, { passive: false });

// ■ [Event] 初期化
canvas.addEventListener("touchmove", (e) => {
  if (!draggingTarget) return;

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const y = touch.clientY - rect.top;
  const val = toValueY(y);

  switch (draggingTarget) {
    case "sinMax": sinMax = Math.max(val, sinMin + 1); break;
    case "sinMin": sinMin = Math.min(val, sinMax - 1); break;
    case "cosMax": cosMax = Math.max(val, cosMin + 1); break;
    case "cosMin": cosMin = Math.min(val, cosMax - 1); break;
    case "sinCenter": {
      const center = val;
      const half = (sinMax - sinMin) / 2;
      sinMax = center + half;
      sinMin = center - half;
      break;
    }
    case "cosCenter": {
      const center = val;
      const half = (cosMax - cosMin) / 2;
      cosMax = center + half;
      cosMin = center - half;
      break;
    }
  }

  document.getElementById("sinMax").value = sinMax;
  document.getElementById("sinMin").value = sinMin;
  document.getElementById("cosMax").value = cosMax;
  document.getElementById("cosMin").value = cosMin;
  document.getElementById("sin_max_input").value = sinMax;
  document.getElementById("sin_min_input").value = sinMin;
  document.getElementById("cos_max_input").value = cosMax;
  document.getElementById("cos_min_input").value = cosMin;

  updateWaveform();
  e.preventDefault();
}, { passive: false });

// ■ [Event] 初期化
canvas.addEventListener("touchend", () => {
  draggingTarget = null;
});
