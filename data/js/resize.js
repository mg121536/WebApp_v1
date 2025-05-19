// resize.js

// ■ リサイズ
function resizeCanvas() {
    const canvasAll = document.getElementById('canvasAll');
    const canvasGraph = document.getElementById('canvasGraph');
    const canvasAngle = document.getElementById('canvasAngle');

    const width = window.innerWidth;  // ウィンドウ幅を取得
    const height = window.innerHeight; // ウィンドウ高さを取得

    // devicePixelRatio（高解像度ディスプレイ対応）
    const ratio = window.devicePixelRatio || 1;

    // Canvasの表示サイズ（CSSで設定）
    canvasAll.style.width = `${width}px`;
    canvasAll.style.height = `${height / 2}px`;

    canvasGraph.style.width = `${width}px`;
    canvasGraph.style.height = `${height / 2}px`;

    canvasAngle.style.width = `${width}px`;
    canvasAngle.style.height = `${height / 2}px`;

    // 内部のピクセル数（devicePixelRatioを考慮）
    canvasAll.width = width * ratio;
    canvasAll.height = (height / 2) * ratio;

    canvasGraph.width = width * ratio;
    canvasGraph.height = (height / 2) * ratio;

    canvasAngle.width = width * ratio;
    canvasAngle.height = (height / 2) * ratio;

    // コンテキストをスケーリング（解像度に合わせて）
    const contextAll = canvasAll.getContext('2d');
    const contextGraph = canvasGraph.getContext('2d');
    const contextAngle = canvasAngle.getContext('2d');

    // context.scaleは、描画時にピクセル比率を適用します
    contextAll.scale(ratio, ratio);
    contextGraph.scale(ratio, ratio);
    contextAngle.scale(ratio, ratio);
}

// リサイズ時の処理を設定
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

