// resize.js

// イベントリスナーでリサイズ処理を呼び出す
window.addEventListener('load', resizeAndRedrawActiveCanvas);
window.addEventListener('resize', resizeAndRedrawActiveCanvas);

// ■ 指定Canvasをリサイズ
function resizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;

    // ウィンドウサイズに基づいて、canvasのサイズを設定
    const displayWidth = Math.round(window.innerWidth * dpr);
    const displayHeight = Math.round(window.innerHeight * dpr);

    // もしサイズが異なっていたら、canvasのピクセルサイズを更新
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needResize) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}

// ■ アクティブタブのキャンバスをリサイズ・再描画
function resizeAndRedrawActiveCanvas() {
    const activeTab = document.querySelector('#canvasTabs .active')?.id.replace('tab_', '');
    if (!activeTab) return;

    // アクティブなタブに対応するキャンバスを取得
    const canvas = document.getElementById(`canvas${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)}`);
    if (!canvas) return;

    // キャンバスがリサイズされたか確認
    const resized = resizeCanvas(canvas);

    // リサイズされた場合は再描画
    if (resized) {
        // 最後のデータを取得
        const lastA = window.A_vals?.[window.A_vals.length - 1] ?? 0;
        const lastB = window.B_vals?.[window.B_vals.length - 1] ?? 0;
        const lastC = window.C_vals?.[window.C_vals.length - 1] ?? 0;
        const lastD = window.D_vals?.[window.D_vals.length - 1] ?? 0;
        const angle = window.Angle ?? 0;

        // 再描画関数が存在する場合、再描画を実行
        if (window.updateActiveCanvas) {
            window.updateActiveCanvas(lastA, lastB, lastC, lastD, angle);
        }
    }
}

function adjustCanvasHeight() {
  const canvasGroup = document.querySelector('.canvas-group');
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const canvasTabs = document.getElementById('canvasTabs');
  const controls = document.getElementById('controls');

  const headerHeight = header?.offsetHeight || 0;
  const footerHeight = footer?.offsetHeight || 0;
  const tabHeight = canvasTabs?.offsetHeight || 0;
  const controlsHeight = controls?.offsetHeight || 0;

  const totalReserved = headerHeight + footerHeight + tabHeight + controlsHeight + 32;

  canvasGroup.style.height = `calc(100vh - ${totalReserved}px)`;
}

window.addEventListener('resize', adjustCanvasHeight);
window.addEventListener('load', adjustCanvasHeight);

