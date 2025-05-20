// init.js

// ■ 初期化
document.addEventListener('DOMContentLoaded', () => 
{
    /* [LOG_TRACE] */
    tracelog();

    startWifi();
});

document.addEventListener('DOMContentLoaded', () => 
{
    log('info', "初期化完了");
});