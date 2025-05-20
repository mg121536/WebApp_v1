// resize.js

// ■ リサイズ
function resizeCanvas() 
{
    const canvasIds = ['canvasAll', 'canvasGraph', 'canvasAngle'];
    const canvases = canvasIds.map(id => document.getElementById(id));

    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = window.devicePixelRatio || 1;
    const halfHeight = height / 2;

    canvases.forEach(canvas => 
    {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${halfHeight}px`;

        canvas.width = width * ratio;
        canvas.height = halfHeight * ratio;

        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
    });
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);


