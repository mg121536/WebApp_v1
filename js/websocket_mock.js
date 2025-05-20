// websocket_mock.js


const MOCK_MAX_INTERVAL_MS = 1000 / 30; // 約30fps
const MOCK_MAX_SMOOTH_LEN = 5;
const mock_smoothBuffer = { A: [], B: [], C: [], D: [] };

// ■ モックWebSocketデータ生成・通信開始
window.startWifi = function startMockWifi() 
{
	/* [LOG_TRACE] */
	tracelog();

	if (window.mockInterval) clearInterval(window.mockInterval);

    window.mockInterval = setInterval(() => 
	{
		const t = Date.now() / 300;

		// 波形データの生成・スムース処理(Sin・Cos・SinN・CosN)
		const A = smooth(2048 + 2048 * Math.sin(t), 'A');
		const B = smooth(2048 + 2048 * Math.cos(t), 'B');
		const C = smooth(2048 + 2048 * -Math.sin(t), 'C');
		const D = smooth(2048 + 2048 * -Math.cos(t), 'D');

        if (A === null || B === null || C === null || D === null) return;

		// 角度データの生成
		const angle = (Math.atan2(Math.sin(t), Math.cos(t)) * 180) / Math.PI;

        //resizeCanvas();

		// 描画更新
        updateActiveCanvas(A, B, C, D, angle);

		log('info', `MockData → Sin:${A.toFixed(0)}, 
                                Cos:${B.toFixed(0)}, 
                                SinN:${C.toFixed(0)}, 
                                CosN:${D.toFixed(0)}, 
                                Angle:${angle.toFixed(1)}°`);
	}, MOCK_MAX_INTERVAL_MS);
};

// ■ モックWi-Fiのデータ生成を停止
window.stopWifi = function stopMockWifi() 
{
	/* [LOG_TRACE] */
	//tracelog();

	if (window.mockInterval) 
	{
		clearInterval(window.mockInterval);
		window.mockInterval = null;
	}
};

// ■ スムース処理
function smooth(value, key) 
{
	/* [LOG_TRACE] */
	//tracelog();

	const buf = mock_smoothBuffer[key];
	buf.push(value);
	if (buf.length > MOCK_MAX_SMOOTH_LEN) buf.shift();
    if (buf.length < MOCK_MAX_SMOOTH_LEN) return null;

	return buf.reduce((a, b) => a + b, 0) / buf.length;
}
