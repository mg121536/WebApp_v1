// resize.js

//window.addEventListener('load', resizeAndRedrawActiveCanvas);
//window.addEventListener('resize', resizeAndRedrawActiveCanvas);
//
//// ■ 指定Canvasをリサイズ
//function resizeCanvas(canvas) 
//{
//    const rect = canvas.getBoundingClientRect();
//    const dpr = window.devicePixelRatio || 1;
//
//    const displayWidth = Math.round(rect.width * dpr);
//    const displayHeight = Math.round(rect.height * dpr);
//
//    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
//    if (needResize) 
//    {
//        canvas.width = displayWidth;
//        canvas.height = displayHeight;
//    }
//    return needResize;
//}
//
//// ■ アクティブタブのキャンバスをリサイズ・再描画
//function resizeAndRedrawActiveCanvas() 
//{
//    const activeTab = document.querySelector('#canvasTabs .active')?.id.replace('tab_', '');
//    if (!activeTab) return;
//
//    const canvas = document.getElementById(`canvas${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)}`);
//    if (!canvas) return;
//
//    const resized = resizeCanvas(canvas);
//    if (resized) 
//    {
//        const lastA = window.A_vals?.[window.A_vals.length - 1] ?? 0;
//        const lastB = window.B_vals?.[window.B_vals.length - 1] ?? 0;
//        const lastC = window.C_vals?.[window.C_vals.length - 1] ?? 0;
//        const lastD = window.D_vals?.[window.D_vals.length - 1] ?? 0;
//        const angle = window.Angle ?? 0;
//
//        window.updateActiveCanvas?.(lastA, lastB, lastC, lastD, angle);
//    }
//            }
//
// resize.js

// イベントリスナーでリサイズ処理を呼び出す
//window.addEventListener('load', resizeAndRedrawActiveCanvas);
//window.addEventListener('resize', resizeAndRedrawActiveCanvas);
//
//// ■ 指定Canvasをリサイズ
//function resizeCanvas(canvas) {
//    const rect = canvas.getBoundingClientRect();
//    const dpr = window.devicePixelRatio || 1;
//
//    // CSSサイズをピクセルに変換して、canvasに適用する
//    const displayWidth = Math.round(rect.width * dpr);
//    const displayHeight = Math.round(rect.height * dpr);
//
//    // もしサイズが異なっていたら、canvasのピクセルサイズを更新
//    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
//    if (needResize) {
//        canvas.width = displayWidth;
//        canvas.height = displayHeight;
//    }
//
//    return needResize;
//}
//
//// ■ アクティブタブのキャンバスをリサイズ・再描画
//function resizeAndRedrawActiveCanvas() {
//    const activeTab = document.querySelector('#canvasTabs .active')?.id.replace('tab_', '');
//    if (!activeTab) return;
//
//    // アクティブなタブに対応するキャンバスを取得
//    const canvas = document.getElementById(`canvas${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)}`);
//    if (!canvas) return;
//
//    // キャンバスがリサイズされたか確認
//    const resized = resizeCanvas(canvas);
//
//    // リサイズされた場合は再描画
//    if (resized) {
//        // 最後のデータを取得
//        const lastA = window.A_vals?.[window.A_vals.length - 1] ?? 0;
//        const lastB = window.B_vals?.[window.B_vals.length - 1] ?? 0;
//        const lastC = window.C_vals?.[window.C_vals.length - 1] ?? 0;
//        const lastD = window.D_vals?.[window.D_vals.length - 1] ?? 0;
//        const angle = window.Angle ?? 0;
//
//        // 再描画関数が存在する場合、再描画を実行
//        if (window.updateActiveCanvas) {
//            window.updateActiveCanvas(lastA, lastB, lastC, lastD, angle);
//        }
//    }
//}
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
