// graph.js
// ctx   : CanvasRenderingContext2D
// canvas: HTMLCanvasElement

const FONT_AXIS  = '5px Noto Sans JP';
const FONT_SIZE = 20;
const COLOR_TEXT = '#ffffff';
const COLOR_AXES = '#ffffff';
const COLOR_GRID = 'rgba(255, 255, 255, 0.2)';
const COLOR_SIN  = 'rgba(255, 0, 0, 1)';
const COLOR_COS  = 'rgba(0, 0, 255, 1)';
const COLOR_SINN = 'rgba(255, 128, 0, 1)';
const COLOR_COSN = 'rgba(0, 255, 255, 1)';
const COLOR_WHITE = 'rgba(255, 255, 255, 1)';
const COLOR_BLACK = 'rgba(0, 0, 0, 1)';
const COLOR_RED   = 'rgba(255, 0, 0, 1)';
const Y_MIN = 0;
const Y_MAX = 5000;
const Y_MARGIN = 0;
const DRAW_Y_MIN = Y_MIN - (Y_MAX * Y_MARGIN);
const DRAW_Y_MAX = Y_MAX + (Y_MAX * Y_MARGIN);
const DRAW_Y_RANGE = DRAW_Y_MAX - DRAW_Y_MIN;
const PADDING = 10;
const THICK_ARC_LINE = 5;
const ANGLE_LINE_WIDTH = 2;
const LABEL_OFFSET = 30;
const DEFAULT_GRID_LINES = 10;

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

// ■ 初期化
document.addEventListener('DOMContentLoaded', function()
{
    /* [LOG_TRACE] */
    tracelog();

    const canvasIds = ['canvasAll', 'canvasGraph', 'canvasAngle'];

    for (let idx = 0; idx < canvasIds.length; idx++) 
    {
        const canvas = document.getElementById(canvasIds[idx]);
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

// ■ タブアクティブ検出
document.addEventListener('visibilitychange', () => 
{
    isPageVisible = !document.hidden;

    if (isPageVisible) 
    {
        // 再描画
        window.updateActiveCanvas(
            A_vals[A_vals.length - 1],
            B_vals[B_vals.length - 1],
            C_vals[C_vals.length - 1],
            D_vals[D_vals.length - 1],
            Angle
        );
    }
});

// ■ データ更新
function updateData(values, newValue)
{
    /* [LOG_TRACE] */
    tracelog();

    values.shift();
    values.push(newValue != null ? newValue : 0);
}

// ■ タイトル描画
function drawTitle(canvas, ctx, title = "タイトル", textColor = COLOR_WHITE) 
{
    /* [LOG_TRACE] */
    //tracelog();

    const fontSize = Math.floor(canvas.height * 0.05);
    ctx.font = `${fontSize}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const titleWidth = ctx.measureText(title).width;
    const xPos = canvas.width / 2;
    const yPos = fontSize * 0.75;

    ctx.fillText(title, xPos, yPos);
}

// ■ XY軸描画
function drawAxes(canvas, ctx, lineColor = COLOR_WHITE) 
{
    /* [LOG_TRACE] */
    //tracelog();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;

    // Y軸
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, canvas.height - MARGIN.bottom); 
    ctx.lineTo(MARGIN.left, 0);
    ctx.stroke();

    // X軸
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, canvas.height - MARGIN.bottom);
    ctx.lineTo(canvas.width, canvas.height - MARGIN.bottom);
    ctx.stroke();
}

// ■ XY軸ラベル描画
function drawAxisNameLabels(canvas, ctx, xLabel = "X", yLabel = "Y", textColor = COLOR_WHITE) 
{
    const fontSize = Math.floor(canvas.height * 0.04);
    ctx.font = `${fontSize}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // X軸ラベル
    ctx.fillText(xLabel, canvas.width / 2, canvas.height - MARGIN.bottom + fontSize * 1.5);

    // Y軸ラベル
    ctx.save();
    ctx.translate(MARGIN.left - fontSize * 2.2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
}

// ■ X軸数値ラベル描画
function drawXAxisLabels(canvas, ctx, steps = 10) 
{
    /* [LOG_TRACE] */
    //tracelog();

    if (steps <= 0) return;

    const stepSize = canvas.width / steps;
    const axisY = canvas.height - MARGIN.bottom;
    const fontSize = Math.floor(canvas.height * 0.03);

    ctx.font = `${fontSize}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = COLOR_WHITE;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const getAdjustedXPos = (i, stepSize, labelWidth) =>
        i === steps ? (stepSize * i) - labelWidth : stepSize * i;

    for (let i = 0; i <= steps; i++)
    {
        const label = i;
        const labelWidth = ctx.measureText(label).width;
        const adjustedXPos = getAdjustedXPos(i, stepSize, labelWidth);

        ctx.fillText(label, adjustedXPos, axisY + 4);
    }
}

// ■ Y軸数値ラベル描画
function drawYAxisLabels(canvas, ctx) 
{
    /* [LOG_TRACE] */
    //tracelog();

    const ySteps = Math.max(5, Math.floor(canvas.height / 50)); 
    const stepSize = Y_MAX / ySteps;
    const graphHeight = canvas.height - MARGIN.top - MARGIN.bottom;

    const fontSize = Math.floor(canvas.height * 0.03);
    ctx.font = `${fontSize}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = COLOR_WHITE;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= ySteps; i++)
    {
        const rawValue = Y_MAX - (stepSize * i);
        const voltage = (rawValue / Y_MAX) * VOLTAGE_REF;

        const y = MARGIN.top + (graphHeight / ySteps) * i;

        const label = (i === 0) 
            ? voltage.toFixed(1) + " V" 
            : voltage.toFixed(1);

        ctx.fillText(label, MARGIN.left - 8, y);
    }
}

// ■ 水平グリッド線描画
function drawHorizontalGridLines(canvas, ctx, steps = 10, margin = MARGIN) 
{
    /* [LOG_TRACE] */
    //tracelog();

    if (steps <= 0) return;

    const startX = MARGIN.left;
    const endX = canvas.width - MARGIN.right;
    const height = canvas.height - MARGIN.top - MARGIN.bottom;

    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;

    for (let i = 0; i <= steps; i++)
    {
        const y = MARGIN.top + (height / steps) * i + 0.5;
        
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
}

// ■ 垂直グリッド線描画
function drawVerticalLines(canvas, ctx, steps = 10) 
{
    if (steps <= 0) return;

    const startY = MARGIN.top;
    const endY = canvas.height - MARGIN.bottom;
    const width = canvas.width - MARGIN.left - MARGIN.right;

    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;

    for (let i = 0; i <= steps; i++) {
        const x = MARGIN.left + (width / steps) * i + 0.5;

        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }
}

// ■ 目盛り線・角度ラベル描画
function drawProtractor(ctx, centerX, centerY, radius) 
{
    const majorTickLength = 10;
    const minorTickLength = 5;

    ctx.strokeStyle = COLOR_BLACK;
    ctx.fillStyle = COLOR_BLACK;
    ctx.font = FONT_AXIS;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let angle = 0; angle < 360; angle += 5) 
    {
        const rad = (angle - 90) * Math.PI / 180;
        const outerX = centerX + radius * Math.cos(rad);
        const outerY = centerY + radius * Math.sin(rad);
        const innerX = centerX + (radius - (angle % 30 === 0 ? majorTickLength : minorTickLength)) * Math.cos(rad);
        const innerY = centerY + (radius - (angle % 30 === 0 ? majorTickLength : minorTickLength)) * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();

        if (angle % 30 === 0) 
        {
            const labelRadius = radius - 20;
            const labelX = centerX + labelRadius * Math.cos(rad);
            const labelY = centerY + labelRadius * Math.sin(rad);
            ctx.fillText(`${angle}°`, labelX, labelY);
        }
    }
}

// ■ 波形描画
function drawWave(canvas, ctx, vals, color)
{
    const graphWidth = canvas.width - MARGIN.left - MARGIN.right;
    const graphHeight = canvas.height - MARGIN.top - MARGIN.bottom;
    const xSpacing = graphWidth / (vals.length - 1);

    ctx.beginPath();
    for (let i = 0; i < vals.length; i++) 
    {
        const val = vals[i];

        const x = MARGIN.left + i * xSpacing;
        const y = MARGIN.top + (1 - (val - DRAW_Y_MIN) / DRAW_Y_RANGE) * graphHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// ■ 角度描画
function drawAngle(canvas, ctx, angle)
{
    /* [LOG_TRACE] */
    //tracelog();

    angle = angle % 360;
    if (angle < 0) angle += 360;

    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.4;
    const radius = Math.min(centerX, centerY) - PADDING;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_WHITE;
    ctx.fill();
    ctx.lineWidth = THICK_ARC_LINE;
    ctx.strokeStyle = COLOR_BLACK;
    ctx.stroke();

    drawProtractor(ctx, centerX, centerY, radius);

    const angleRad = (angle - 90) * Math.PI / 180;
    const endX = centerX + radius * Math.cos(angleRad);
    const endY = centerY + radius * Math.sin(angleRad);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = ANGLE_LINE_WIDTH;
    ctx.strokeStyle = COLOR_RED;
    ctx.stroke();

    ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COLOR_WHITE;
    ctx.fillStyle = COLOR_WHITE;
    ctx.strokeText(`${Math.floor(angle)}°`, centerX, centerY + radius + LABEL_OFFSET);
    ctx.fillText(`${Math.floor(angle)}°`, centerX, centerY + radius + LABEL_OFFSET);
}


// ■ キャンバス切替表示
function showCanvas(mode) 
{
    /* [LOG_TRACE] */
    //tracelog();

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
        angle: document.getElementById('tab_angle')
    };

    for (let key in canvases) 
    {
        canvases[key].style.display = 'none';
        tabs[key].classList.remove('active');
    }

    if (canvases[mode] && tabs[mode]) 
    {
        canvases[mode].style.display = 'block';
        tabs[mode].classList.add('active');
    }
    window.updateActiveCanvas(
        A_vals[A_vals.length - 1],
        B_vals[B_vals.length - 1],
        C_vals[C_vals.length - 1],
        D_vals[D_vals.length - 1],
        Angle
    );
}

// ■ アクティブなタブ取得
function getActiveTab() 
{
    const tabElements = 
    {
        all: document.getElementById('tab_all'),
        graph: document.getElementById('tab_graph'),
        angle: document.getElementById('tab_angle')
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

// ■ アクティブなタブに応じて描画を更新
window.updateActiveCanvas = function updateActiveCanvas(A_val, B_val, C_val, D_val, angle) 
{
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

// ■ 波形描画更新
window.updateGraph = function updateGraph(A_val, B_val, C_val, D_val) 
{
    /* [LOG_TRACE] */
    tracelog();

    updateData(A_vals, A_val);
    updateData(B_vals, B_val);
    updateData(C_vals, C_val);
    updateData(D_vals, D_val);

    if (!isPageVisible) return;
    const canvas = document.getElementById('canvasGraph');
    const ctx = canvas.getContext('2d');
    log('info', { A: A_val, B: B_val, C: C_val, D: D_val });

    // 波形描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTitle(canvas, ctx, 'Sin・Cos・SinN・CosN');
    drawAxes(canvas, ctx);
    drawYAxisLabels(canvas, ctx);
    drawXAxisLabels(canvas, ctx);
    drawAxisNameLabels(canvas, ctx, xLabel = "Time", yLabel = "Voltage(V)", textColor = COLOR_WHITE);
    drawHorizontalGridLines(canvas, ctx);
    drawVerticalLines(canvas, ctx);

    const showSin  = document.getElementById('sinCheckbox')?.checked ?? true;
    const showCos  = document.getElementById('cosCheckbox')?.checked ?? true;
    const showSinN = document.getElementById('sinNCheckbox')?.checked ?? true;
    const showCosN = document.getElementById('cosNCheckbox')?.checked ?? true;

    if (showCos) drawWave(canvas, ctx, A_vals, COLOR_COS);
    if (showSin) drawWave(canvas, ctx, B_vals, COLOR_SIN);
    if (showCosN) drawWave(canvas, ctx, C_vals, COLOR_COSN);
    if (showSinN) drawWave(canvas, ctx, D_vals, COLOR_SINN);
}

// ■ 角度描画更新
window.updateAngle = function updateAngle(angle) 
{
    /* [LOG_TRACE] */
    tracelog();

    if (!isPageVisible) return;

    Angle = angle;
    const canvas = document.getElementById('canvasAngle');
    const ctx = canvas.getContext('2d');
    log('info', { Angle: angle });

    // 角度描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(canvas, ctx, 'Angle');
    drawAngle(canvas, ctx, angle);
}

// ■ 波形＆角度描画更新
window.updateWaveAndAngle = function updateWaveAndAngle(A_val, B_val, C_val, D_val, angle) 
{
    /* [LOG_TRACE] */
    tracelog();

    if (!isPageVisible) return;

    updateData(A_vals, A_val);
    updateData(B_vals, B_val);
    updateData(C_vals, C_val);
    updateData(D_vals, D_val);
    Angle = angle;
    log('info', { A: A_val, B: B_val, C: C_val, D: D_val, angle});

    const canvas = document.getElementById('canvasAll');
    const originalDisplay = canvas.style.display;
    if (originalDisplay === 'none') 
    {
        canvas.style.display = 'block';
    }
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 左半分: 波形描画エリア
    const canvas1 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d');
    canvas1.width = Math.floor(width * 0.7);
    canvas1.height = height;       

    drawTitle(canvas1, ctx1, 'Sin・Cos・SinN・CosN');
    drawAxes(canvas1, ctx1);
    drawYAxisLabels(canvas1, ctx1);
    drawXAxisLabels(canvas1, ctx1);
    drawAxisNameLabels(canvas1, ctx1, xLabel = "Time", yLabel = "Voltage(V)", textColor = COLOR_WHITE);
    drawHorizontalGridLines(canvas1, ctx1);
    drawVerticalLines(canvas1, ctx1);

    const showSin  = document.getElementById('sinCheckbox')?.checked ?? true;
    const showCos  = document.getElementById('cosCheckbox')?.checked ?? true;
    const showSinN = document.getElementById('sinNCheckbox')?.checked ?? true;
    const showCosN = document.getElementById('cosNCheckbox')?.checked ?? true;

    if (showCos) drawWave(canvas1, ctx1, A_vals, COLOR_COS);
    if (showSin) drawWave(canvas1, ctx1, B_vals, COLOR_SIN);
    if (showCosN) drawWave(canvas1, ctx1, C_vals, COLOR_COSN);
    if (showSinN) drawWave(canvas1, ctx1, D_vals, COLOR_SINN);
    ctx.drawImage(canvas1, 0, 0);

    // 右半分: 角度描画エリア
    const canvas2 = document.createElement('canvas');
     const ctx2 = canvas2.getContext('2d');
    canvas2.width = Math.floor(width * 0.3);
    canvas2.height = height;    

    drawTitle(canvas2, ctx2, 'Angle');
    drawAngle(canvas2, ctx2, angle);
    ctx.drawImage(canvas2, canvas1.width, 0);
    if (originalDisplay === 'none') 
    {
        canvas.style.display = originalDisplay;
    }
}
