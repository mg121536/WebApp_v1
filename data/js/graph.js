// graph.js
// ctx   : CanvasRenderingContext2D
// canvas: HTMLCanvasElement

const COLOR_GRID  = 'rgba(255, 255, 255, 0.2)';
const COLOR_SIN   = 'rgba(255, 0, 0, 1)';
const COLOR_COS   = 'rgba(0, 0, 255, 1)';
const COLOR_SINN  = 'rgba(255, 128, 0, 1)';
const COLOR_COSN  = 'rgba(0, 255, 255, 1)';
const COLOR_WHITE = 'rgba(255, 255, 255, 1)';
const COLOR_BLACK = 'rgba(0, 0, 0, 1)';
const COLOR_RED   = 'rgba(255, 0, 0, 1)';
const Y_MIN    = 0;
const Y_MAX    = 5000;
const Y_MARGIN = 0;
const DRAW_Y_MIN   = Y_MIN - (Y_MAX * Y_MARGIN);
const DRAW_Y_MAX   = Y_MAX + (Y_MAX * Y_MARGIN);
const DRAW_Y_RANGE = DRAW_Y_MAX - DRAW_Y_MIN;
const VOLTAGE_REF = 5.0;

const maxDataPoints = 100;
const A_vals = Array(maxDataPoints).fill(0);
const B_vals = Array(maxDataPoints).fill(0);
const C_vals = Array(maxDataPoints).fill(0);
const D_vals = Array(maxDataPoints).fill(0);
let Angle = 0;
let isPageVisible = true;

const MARGIN = 
{
    top: 40,
    right: 40,
    bottom: 120,
    left: 120
};

// ■ [Event] 初期化
document.addEventListener('DOMContentLoaded', function()
{
    // /* [LOG_TRACE] */  tracelog();
});

// ■ [Event] タブアクティブ検出
document.addEventListener('visibilitychange', function()
{
    /* [LOG_TRACE] */  tracelog();

    isPageVisible = !document.hidden;

    if (isPageVisible) 
    {
        updateActiveCanvas(window.A, window.B, window.C, window.D, window.angle);
    }
});

// ■ アクティブタブ取得
function getActiveTab() 
{
    // /* [LOG_TRACE] */  tracelog();

    const tabElements = 
    {
        all: document.getElementById('tab_all'),
        graph: document.getElementById('tab_graph'),
        angle: document.getElementById('tab_angle'),
        console: document.getElementById('tab_console'),
        settings: document.getElementById('tab_settings')
    };

    for (let key in tabElements) 
    {
        if (tabElements[key].classList.contains('active')) 
        {
            return key;
        }
    }
    return null;
}

// ■ アクティブタブ設定
function setActiveTab(mode) 
{
    const canvases = 
    {
        all: document.getElementById('canvasAll'),
        graph: document.getElementById('canvasGraph'),
        angle: document.getElementById('canvasAngle')
    };

    const tabs = 
    {
        all: document.getElementById('tab_all'),
        graph: document.getElementById('tab_graph'),
        angle: document.getElementById('tab_angle'),
        console: document.getElementById('tab_console'),
        settings: document.getElementById('tab_settings')
    };

    const canvasContainer = document.getElementById('canvasContainer');
    const consoleContainer = document.getElementById('consoleContainer');
    const settingsView = document.getElementById('settingsView');

    for (let key in canvases)
    {
        canvases[key].style.display = 'none';
    }
    for (let key in tabs) 
    {
        tabs[key]?.classList.remove('active');
    }

    canvasContainer.style.display = 'none';
    consoleContainer.style.display = 'none';
    settingsView.style.display = 'none';

    if (mode === 'console') 
    {
        consoleContainer.style.display = 'block';
        tabs.console.classList.add('active');
    } 
    else if (mode === 'settings') 
    {
        settingsView.style.display = 'block';
        tabs.settings.classList.add('active');
    } 
    else 
    {
        if (canvases[mode]) 
        {
            canvases[mode].style.display = 'block';
            tabs[mode].classList.add('active');
            canvasContainer.style.display = 'block';
        }
        
        if (mode === 'all' || mode === 'graph' || mode === 'angle') 
        {
            window.updateActiveCanvas(
                A_vals[A_vals.length - 1],
                B_vals[B_vals.length - 1],
                C_vals[C_vals.length - 1],
                D_vals[D_vals.length - 1],
                Angle
            );
        }
    }
    window.currentMode = mode;
}

// ■ マージン取得
function getResponsiveMargin(canvas) 
{
    // /* [LOG_TRACE] */  tracelog();
    const width = canvas.width;
    const height = canvas.height;

    return {
        top: Math.max(height * 0.03, 10),
        right: Math.max(width * 0.03, 10),
        bottom: Math.max(height * 0.07, 20),
        left: Math.max(width * 0.07, 20)
    };
}

// ■ Canvasオフスクリーン
function resizeCanvasForHighDPI(canvas, ctx, logicalWidth, logicalHeight) 
{
    canvas.width = logicalWidth;
    canvas.height = logicalHeight;
    canvas.style.width = logicalWidth + "px";
    canvas.style.height = logicalHeight + "px";
}


// ■ 仮想Canvas作成
function createOffscreenCanvas(width, height) 
{
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d');
}

// ■ データ更新
function updateData(values, newValue)
{
    // /* [LOG_TRACE] */  tracelog();

    values.shift();
    values.push(newValue != null ? newValue : 0);
}

// ■ タイトル描画
function drawTitle(canvas, ctx, title = "タイトル", width, height, textColor = COLOR_WHITE) 
{
    // /* [LOG_TRACE] */  tracelog();

    const fontSize = Math.floor(height * 0.03);
    ctx.font = `${fontSize}px "Noto Sans JP", "Helvetica Neue", "Helvetica", "Arial", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const metrics = ctx.measureText(title);
    const xPos = width / 2;
    const yPos = fontSize / 2 + metrics.actualBoundingBoxAscent / 2;

    ctx.fillText(title, xPos, yPos);
}

// ■ XY軸描画
function drawAxes(canvas, ctx, lineColor = COLOR_WHITE) 
{
    // /* [LOG_TRACE] */  tracelog();

    const margin = getResponsiveMargin(canvas);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;

    // Y軸
    ctx.beginPath();
    ctx.moveTo(margin.left, canvas.height - margin.bottom); 
    ctx.lineTo(margin.left, 0);
    ctx.stroke();

    // X軸
    ctx.beginPath();
    ctx.moveTo(margin.left, canvas.height - margin.bottom);
    ctx.lineTo(canvas.width, canvas.height - margin.bottom);
    ctx.stroke();
}

// ■ XY軸ラベル描画
function drawAxisNameLabels(canvas, ctx, xLabel = "X", yLabel = "Y", textColor = COLOR_WHITE) 
{
    // /* [LOG_TRACE] */  tracelog();

    const fontSize = Math.floor(canvas.height * 0.04);
    const margin = getResponsiveMargin(canvas);

    ctx.font = `${fontSize}px "Noto Sans JP", "Helvetica Neue", "Helvetica", "Arial", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // X軸ラベル
    ctx.fillText(xLabel, canvas.width / 2, canvas.height - margin.bottom + fontSize * 1.5);
    // Y軸ラベル
    ctx.save();
    ctx.translate(margin.left - fontSize * 2.2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
}

// ■ X軸数値ラベル描画
function drawXAxisLabels(canvas, ctx, steps = 10) 
{
    // /* [LOG_TRACE] */  tracelog();

    if (steps <= 0) return;

    const margin = getResponsiveMargin(canvas);
    const labelAreaWidth = canvas.width - margin.left - margin.right;
    const stepSize = labelAreaWidth / steps;
    const axisY = canvas.height - margin.bottom;
    const fontSize = Math.floor(canvas.height * 0.03);

    ctx.font = `${fontSize}px "Noto Sans JP", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"`;
    ctx.fillStyle = COLOR_WHITE;
    ctx.textBaseline = "top";

    for (let idx = 0; idx <= steps; idx++) 
    {
        const label = idx;
        const x = margin.left + stepSize * idx;

        ctx.textAlign = (idx === 0) ? "left" : (idx === steps) ? "right" : "center";
        ctx.fillText(label, x, axisY + 4);
    }
}


// ■ Y軸数値ラベル描画
function drawYAxisLabels(canvas, ctx) 
{
    // /* [LOG_TRACE] */  tracelog();

    const margin = getResponsiveMargin(canvas);
    const ySteps = Math.max(5, Math.floor(canvas.height / 50)); 
    const stepSize = Y_MAX / ySteps;
    const graphHeight = canvas.height - margin.top - margin.bottom;
    const fontSize = Math.floor(canvas.height * 0.03);

    ctx.font = `${fontSize}px "Noto Sans JP", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"`;
    ctx.fillStyle = COLOR_WHITE;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let idx = 0; idx <= ySteps; idx++) 
    {
        const rawValue = Y_MAX - (stepSize * idx);
        const voltage = (rawValue / Y_MAX) * VOLTAGE_REF;

        const y = margin.top + (graphHeight / ySteps) * idx;

        const label = (idx === 0) 
            ? voltage.toFixed(1) + " V" 
            : voltage.toFixed(1);

        ctx.fillText(label, margin.left - 8, y);
    }
}


// ■ 水平グリッド線描画
function drawHorizontalGridLines(canvas, ctx, steps = 10) 
{
    // /* [LOG_TRACE] */  tracelog();

    if (steps <= 0) return;

    const margin = getResponsiveMargin(canvas);
    const startX = margin.left;
    const endX = canvas.width - margin.right;
    const height = canvas.height - margin.top - margin.bottom;

    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;

    for (let idx = 0; idx <= steps; idx++) 
    {
        const y = margin.top + (height / steps) * idx + 0.5;

        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
}

// ■ 垂直グリッド線描画
function drawVerticalLines(canvas, ctx, steps = 10) 
{
    // /* [LOG_TRACE] */  tracelog();

    if (steps <= 0) return;

    const margin = getResponsiveMargin(canvas);
    const startY = margin.top;
    const endY = canvas.height - margin.bottom;
    const width = canvas.width - margin.left - margin.right;

    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;

    for (let idx = 0; idx <= steps; idx++) 
    {
        const x = margin.left + (width / steps) * idx + 0.5;

        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }
}


// ■ 目盛り線・角度ラベル描画
function drawProtractor(ctx, centerX, centerY, radius, canvas) 
{
    // /* [LOG_TRACE] */  tracelog();

    const baseSize = Math.min(canvas.width, canvas.height);

    const majorTickLength = baseSize * 0.06;
    const minorTickLength = baseSize * 0.02;
    const labelOffset = baseSize * 0.1;
    const fontSize = Math.floor(baseSize * 0.025);

    ctx.strokeStyle = COLOR_BLACK;
    ctx.fillStyle = COLOR_BLACK;
    ctx.font = `${fontSize }px "Noto Sans JP", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let angle = 0; angle < 360; angle += 5) 
    {
        const rad = (angle - 90) * Math.PI / 180;

        const outerX = centerX + radius * Math.cos(rad);
        const outerY = centerY + radius * Math.sin(rad);

        const isMajor = angle % 30 === 0;
        const tickLength = isMajor ? majorTickLength : minorTickLength;

        const innerX = centerX + (radius - tickLength) * Math.cos(rad);
        const innerY = centerY + (radius - tickLength) * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();

        if (isMajor) 
        {
            const labelRadius = radius - labelOffset;
            const labelX = centerX + labelRadius * Math.cos(rad);
            const labelY = centerY + labelRadius * Math.sin(rad);
            ctx.fillText(`${angle}°`, labelX, labelY);
        }
    }
}

// ■ 波形描画
function drawWave(canvas, ctx, vals, color) 
{
    // /* [LOG_TRACE] */  tracelog();

    const margin = getResponsiveMargin(canvas);
    const graphWidth = canvas.width - margin.left - margin.right;
    const graphHeight = canvas.height - margin.top - margin.bottom;
    const xSpacing = graphWidth / (vals.length - 1);

    ctx.beginPath();
    for (let idx = 0; idx < vals.length; idx++) 
    {
        const val = vals[idx];

        const x = margin.left + idx * xSpacing;
        const y = margin.top + (1 - (val - DRAW_Y_MIN) / DRAW_Y_RANGE) * graphHeight;

        if (idx === 0) 
        {
            ctx.moveTo(x, y);
        } 
        else 
        {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// ■ 角度描画
function drawAngle(canvas, ctx, width, height, angle) 
{
    // /* [LOG_TRACE] */  tracelog();

    angle = angle % 360;
    if (angle < 0) angle += 360;

    const baseSize = Math.min(width, height);
    const padding = baseSize * 0.05;
    const labelOffset = baseSize * 0.08;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - padding - labelOffset;

    const angleLineWidth = baseSize * 0.01;
    const arcLineWidth = baseSize * 0.012;
    const fontSize = Math.floor(baseSize * 0.05);

    ctx.clearRect(0, 0, width, height);

    // 円（外枠）
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_WHITE;
    ctx.fill();
    ctx.lineWidth = arcLineWidth;
    ctx.strokeStyle = COLOR_BLACK;
    ctx.stroke();

    // 分度器（目盛りと角度ラベル）
    drawProtractor(ctx, centerX, centerY, radius, canvas);

    // 角度線
    const angleRad = (angle - 90) * Math.PI / 180;
    const endX = centerX + radius * Math.cos(angleRad);
    const endY = centerY + radius * Math.sin(angleRad);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = angleLineWidth;
    ctx.strokeStyle = COLOR_RED;
    ctx.stroke();

    // 角度ラベル
    ctx.font = `${fontSize}px "Noto Sans JP", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COLOR_WHITE;
    ctx.fillStyle = COLOR_WHITE;
    const angleLabelY = centerY + radius + labelOffset;
    ctx.strokeText(`${Math.floor(angle)}°`, centerX, angleLabelY);
    ctx.fillText(`${Math.floor(angle)}°`, centerX, angleLabelY);
}

// ■ アクティブなタブに応じて描画を更新
window.updateActiveCanvas = function updateActiveCanvas(A_val, B_val, C_val, D_val, angle) 
{
    // /* [LOG_TRACE] */  tracelog();

    const activeTab = getActiveTab();

    if (activeTab === 'all') 
    {
        updateWaveAndAngle(A_val, B_val, C_val, D_val, angle);
    } 
    else if (activeTab === 'graph') 
    {
        updateGraph(A_val, B_val, C_val, D_val);
    } 
    else if (activeTab === 'angle') 
    {
        updateAngle(angle);
    }
}

// ■ 描画更新
const sinCheckbox  = document.getElementById('sinCheckbox');
const cosCheckbox  = document.getElementById('cosCheckbox');
const sinNCheckbox = document.getElementById('sinNCheckbox');
const cosNCheckbox = document.getElementById('cosNCheckbox');

// ■ 波形描画更新
const canvasGraph = document.getElementById('canvasGraph');
const ctxGraph = canvasGraph.getContext('2d');

const canvas1 = document.createElement('canvas');
canvas1.width = canvasGraph.width;
canvas1.height = canvasGraph.height;
const ctx1 = canvas1.getContext('2d');

window.updateGraph = function updateGraph(A_val, B_val, C_val, D_val) 
{
    // /* [LOG_TRACE] */  tracelog();

    if (!isPageVisible) return;

    updateData(A_vals, A_val);
    updateData(B_vals, B_val);
    updateData(C_vals, C_val);
    updateData(D_vals, D_val);

    log('info', { A: A_val, B: B_val, C: C_val, D: D_val });

    const wasHidden = canvasGraph.style.display === 'none';
    if (wasHidden && getActiveTab() === 'graph') canvasGraph.style.display = 'block';
    ctxGraph.clearRect(0, 0, canvasGraph.width, canvasGraph.height);
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

    drawTitle(canvas1, ctx1, 'Sin・Cos・SinN・CosN', canvas1.width, canvas1.height);
    drawAxes(canvas1, ctx1);
    drawYAxisLabels(canvas1, ctx1);
    drawXAxisLabels(canvas1, ctx1);
    drawAxisNameLabels(canvas1, ctx1, "Time", "Voltage(V)", COLOR_WHITE);
    drawHorizontalGridLines(canvas1, ctx1);
    drawVerticalLines(canvas1, ctx1);

    const showSin  = sinCheckbox && sinCheckbox.checked;
    const showCos  = cosCheckbox && cosCheckbox.checked;
    const showSinN = sinNCheckbox && sinNCheckbox.checked;
    const showCosN = cosNCheckbox && cosNCheckbox.checked;

    if (showCos)  drawWave(canvas1, ctx1, A_vals, COLOR_COS);
    if (showSin)  drawWave(canvas1, ctx1, B_vals, COLOR_SIN);
    if (showCosN) drawWave(canvas1, ctx1, C_vals, COLOR_COSN);
    if (showSinN) drawWave(canvas1, ctx1, D_vals, COLOR_SINN);

    ctxGraph.drawImage(canvas1, 0, 0);
};

// ■ 角度描画更新
const canvasAngle = document.getElementById('canvasAngle');
const ctxAngle = canvasAngle.getContext('2d');

const canvas2 = document.createElement('canvas');
canvas2.width = canvasAngle.width;
canvas2.height = canvasAngle.height;
const ctx2 = canvas2.getContext('2d');

window.updateAngle = function updateAngle(angle) 
{
    // /* [LOG_TRACE] */  tracelog();

    if (!isPageVisible) return;

    Angle = angle;

    log('info', { Angle: angle });

    const wasHidden = canvasAngle.style.display === 'none';
    if (wasHidden && getActiveTab() === 'angle') canvasAngle.style.display = 'block';

    ctxAngle.clearRect(0, 0, canvasAngle.width, canvasAngle.height);
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);;

    drawTitle(canvas2, ctx2, 'Angle', canvas2.width, canvas2.height);
    drawAngle(canvas2, ctx2, canvas2.width, canvas2.height, angle);

    ctxAngle.drawImage(canvas2, 0, 0);
};

// ■ 波形＆角度描画更新
const canvasAll = document.getElementById('canvasAll');
const ctxAll = canvasAll.getContext('2d');
let leftWidth = Math.floor(canvasAll.width * 0.75);
//let leftWidth = canvasAll.width;
let rightWidth = canvasAll.width - leftWidth;

const canvas3 = document.createElement('canvas');
canvas3.width = leftWidth;
canvas3.height = canvasAll.height;
const ctx3 = canvas3.getContext('2d');

const canvas4 = document.createElement('canvas');
canvas4.width = rightWidth;
canvas4.height = canvasAll.height;
const ctx4 = canvas4.getContext('2d');

window.updateWaveAndAngle = function updateWaveAndAngle(A_val, B_val, C_val, D_val, angle) 
{
    // /* [LOG_TRACE] */  tracelog();

    if (!isPageVisible) return;

    updateData(A_vals, A_val);
    updateData(B_vals, B_val);
    updateData(C_vals, C_val);
    updateData(D_vals, D_val);
    Angle = angle;

    log('info', { A: A_val, B: B_val, C: C_val, D: D_val, angle });

    const wasHidden = canvasAll.style.display === 'none';
    if (wasHidden && getActiveTab() === 'all') canvasAll.style.display = 'block';

    ctxAll.clearRect(0, 0, canvasAll.width, canvasAll.height);
    ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
    ctx4.clearRect(0, 0, canvas4.width, canvas4.height);

    drawTitle(canvas3, ctx3, 'Sin・Cos・SinN・CosN', leftWidth, canvasAll.height);
    drawAxes(canvas3, ctx3);
    drawYAxisLabels(canvas3, ctx3);
    drawXAxisLabels(canvas3, ctx3);
    drawAxisNameLabels(canvas3, ctx3, "Time", "Voltage(V)", COLOR_WHITE);
    drawHorizontalGridLines(canvas3, ctx3);
    drawVerticalLines(canvas3, ctx3);

    const showSin = sinCheckbox ? sinCheckbox.checked : false;
    const showCos = cosCheckbox ? cosCheckbox.checked : false;
    const showSinN = sinNCheckbox ? sinNCheckbox.checked : false;
    const showCosN = cosNCheckbox ? cosNCheckbox.checked : false;

    if (showCos) drawWave(canvas3, ctx3, A_vals, COLOR_COS);
    if (showSin) drawWave(canvas3, ctx3, B_vals, COLOR_SIN);
    if (showCosN) drawWave(canvas3, ctx3, C_vals, COLOR_COSN);
    if (showSinN) drawWave(canvas3, ctx3, D_vals, COLOR_SINN);

    ctxAll.drawImage(canvas3, 0, 0);

    drawTitle(canvas4, ctx4, 'Angle', rightWidth, canvasAll.height);
    drawAngle(canvas4, ctx4, rightWidth, canvasAll.height, angle);
    ctxAll.drawImage(canvas4, leftWidth, 0);
}
