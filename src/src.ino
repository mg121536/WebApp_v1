/******************************************************************************
 *  File        : src.ino
 *  Description : Reads analog signals (sin and cos) from rotary encoder and
 *                calculates angle of rotation in degrees.
 *  Target      : ESP32-S3-DEV-KIT-N16R8-M
 *  Date        : 2025/XX/XX
 *  License     : MinebeaMitsumi Inc.
 ******************************************************************************/

#include <Arduino.h>
#include <LittleFS.h>
#include <esp_bt.h>
#include <float.h>
/* local */
#include <IPS_Cfg.h>
#include <IPS.h>
#include <IPS_Debug.h>
#include <IPS_Wifi.h>

//==============================================================================
// Define
//==============================================================================

#define STATIC_FILE_PATH_COUNT    (sizeof(gStaticFile) / sizeof(gStaticFile[0]))
#define STATIC_DIR_PATH_COUNT     (sizeof(gStaticDir) / sizeof(gStaticDir[0]))

//==============================================================================
// Struct
//==============================================================================

#if 0
#pragma pack(push, 1)
struct SensorPacket {
  uint16_t sin;
  uint16_t cos;
  uint16_t sinn;
  uint16_t cosn;
  float angle;
};
#pragma pack(pop)
#endif

//==============================================================================
// Variable
//==============================================================================

/* IPS */
int pole_pairs = 4U;
Sensor sensors[IPS_NUM_SENSORS];

/* cos */
int cos_val = 0;
int cos_max = INT_MIN;
int cos_min = INT_MAX;
float cos_off = 0;
float cos_amp = 1.0;
float cos_nor = 0;
/* sin */
int sin_val = 0;
int sin_max = INT_MIN;
int sin_min = INT_MAX;
float sin_off = 0;
float sin_amp = 1.0;
float sin_nor = 0;

/* Timiing */
unsigned long lastSensorReadTime = 0U;
const unsigned long sensorInterval = IPS_CFG_WIFI_TX_INTERVAL;
/* Wi-Fi・Server */
const char* ssid = IPS_WIFI_SSID;
const char* password = IPS_WIFI_PASSWARD;

const int gpio_pins[] = 
{
  IPS_CFG_PORT_GPIO_COS,
  IPS_CFG_PORT_GPIO_SIN,
  IPS_CFG_PORT_GPIO_COSN,
  IPS_CFG_PORT_GPIO_SINN
};

const char* gStaticFile[] = 
{
  /* HTML */
  "/index.html",
  "/portal.html",
  "/offline.html",
  /* CSS */
  "/css/style.css",
  /* JavaScript */
  "/js/log.js",
  "/js/ui-control.js",
  "/js/resize.js",
  "/js/graph.js",
  "/js/serial.js",
  //"/js/serial_mock.js",
  "/js/websocket.js",
  //"/js/websocket_mock.js",
  "/js/init.js",
  "/js/script.js",
  "/service-worker.js",
  "/register-sw.js",
  /* manifest */
  "/manifest.json"
};

const char* gStaticDir[] = 
{
  "/img"
};

const char* gCaptivePortal[] = 
{
  "/generate_204",
  "/hotspot-detect.html",
  "/ncsi.txt",
  "/connecttest.txt",
  "/redirect",
  "/wpad.dat",
};

DNSServer dnsServer;
WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

//==============================================================================
// 実装中
//==============================================================================
float currentAngle = 0.0f;

//==============================================================================
// API
//==============================================================================
void Esp_Init();
void Wifi_init();
void Wifi_HandleNetworkEvent();
void Wifi_SendData(Sensor sensors[]);
void onWebSocketEvent(uint8_t client_num, WStype_t type, uint8_t* payload, size_t length);

static void ips_setting();
static void ips_Calibration();
static int  ips_AnalogReadAverage(int pin);
static void ips_AngleCalculation();
static void server_SetupStaticFiles();
static void server_SetupWebServer();

//==============================================================================
// Setup
//==============================================================================
void setup() 
{
  Esp_Init();

  Wifi_init();
}

//==============================================================================
// Loop
//==============================================================================
void loop() 
{
  unsigned long now = millis();

  Wifi_HandleNetworkEvent();

  if (now - lastSensorReadTime >= sensorInterval) 
  {
    lastSensorReadTime = now;

    for (int idx = 0U; idx < IPS_NUM_SENSORS; idx++)
    {
      sensors[idx].val = analogRead(sensors[idx].pin);
    }
    LOG_INFO("Sin: %d\tCos: %d\tSinN: %d\tCosN: %d", 
      sensors[0].val, sensors[1].val, 
      sensors[2].val, sensors[3].val);

    ips_Calibration();
    ips_AngleCalculation();
    Wifi_SendData(sensors);
  }
}

//==============================================================================
// ESP
//==============================================================================
/* ESP初期化 */
void Esp_Init()
{
  ips_setting();

  LOG_INFO("ESP Init");
}

/* IPS初期化 */
void ips_setting()
{
  /* Waiting for startup */
  delay(IPS_CFG_ESP_STARTUP_DELAY);

  /* port settings */
  for (int idx = 0x00U; idx < IPS_NUM_SENSORS; idx++)
  {
    pinMode(gpio_pins[idx], INPUT);
    sensors[idx].pin = gpio_pins[idx];
    sensors[idx].val = IPS_CFG_ADC_MIN_VALUE;
    sensors[idx].max = IPS_CFG_ADC_MIN_VALUE;
    sensors[idx].min = IPS_CFG_ADC_MAX_VALUE;
  }

  Serial.begin(IPS_CFG_SERIAL_BAUDRATE);
  /* esp32 disable settings */
  esp_bt_controller_mem_release(ESP_BT_MODE_BTDM);
#if (IPS_DEBUG == 0U)
  esp_log_level_set("*", ESP_LOG_NONE);
#endif /* IPS_DEBUG == 0U */
  /* esp32 enable settings */
  analogReadResolution(IPS_CFG_ADC_BITS);
  analogSetAttenuation(IPS_CFG_ADC_INPUT_V_RANGE);

  unsigned long calibrationStartTime = millis();

  while (millis() - calibrationStartTime < 30000U)
  {
    ips_Calibration();
  }
  LOG_INFO("IPS Init");
}

/* IPSキャリブレーション */
static void ips_Calibration()
{
  for (int idx = 0U; idx < IPS_NUM_SENSORS; idx++)
  {
    sensors[idx].val = ips_AnalogReadAverage(sensors[idx].pin);
    sensors[idx].max = max(sensors[idx].max, sensors[idx].val);
    sensors[idx].min = min(sensors[idx].min, sensors[idx].val);
    LOG_INFO("Sensor %d (Pin: %d) Val: %d, Max: %d, Min: %d",
      idx, sensors[idx].pin, sensors[idx].val, sensors[idx].max, sensors[idx].min);
  }
}

static int ips_AnalogReadAverage(int pin)
{
  int sum = 0U;
  for (int idx = 0U; idx < IPS_ANALOG_NUM_READ_SAMPLE; idx++) 
  {
    sum += analogRead(pin);
  }
  return (sum / IPS_ANALOG_NUM_READ_SAMPLE);
}

/* 角度演算 */
static void ips_AngleCalculation() 
{
  /* sin */
  int mid   = (sensors[IPS_IDX_SIN_DATA].max + sensors[IPS_IDX_SIN_DATA].min) / 2U;
  int mid_n = (sensors[IPS_IDX_SINN_DATA].max + sensors[IPS_IDX_SINN_DATA].min) / 2U;
  sin_val = ((sensors[IPS_IDX_SIN_DATA].val - mid) - (sensors[IPS_IDX_SINN_DATA].val - mid_n));
  sin_max = max(sin_max, sin_val);
  sin_min = min(sin_min, sin_val);
  sin_off = (sin_max + sin_min) / 2.0;
  sin_amp = (sin_max - sin_min) / 2.0;
  if (fabs(sin_amp) < 1.0) sin_amp = 1.0;
  sin_nor = (sin_val - sin_off) / sin_amp;

  /* cos */
  mid   = (sensors[IPS_IDX_COS_DATA].max + sensors[IPS_IDX_COS_DATA].min) / 2U;
  mid_n = (sensors[IPS_IDX_COSN_DATA].max + sensors[IPS_IDX_COSN_DATA].min) / 2U;
  cos_val = ((sensors[IPS_IDX_COS_DATA].val - mid) - (sensors[IPS_IDX_COSN_DATA].val - mid_n));
  cos_max = max(cos_max, cos_val);
  cos_min = min(cos_min, cos_val);
  cos_off = (cos_max + cos_min) / 2.0;
  cos_amp = (cos_max - cos_min) / 2.0;
  if (fabs(cos_amp) < 1.0) cos_amp = 1.0;
  cos_nor = (cos_val - cos_off) / cos_amp;

  float angle_rad = atan2f(sin_nor, cos_nor);
  float angle_deg = angle_rad * IPS_ANGLE_DEG_PER_RAD;
  if (angle_deg < 0)
  {
    angle_deg += 360.0;
  }
  currentAngle = angle_deg;

  LOG_INFO("cos_nor: %.3f, sin_nor: %.3f, angle_deg: %.2f",
    cos_nor, sin_nor, angle_deg);
}

//==============================================================================
// WebSocket / Wi-Fi / DNS
//==============================================================================

/* [Function]: Wi-Fi初期化 */
void Wifi_init() 
{
  /* Start SoftAP */
  if (!WiFi.softAP(ssid, password)) 
  {
    LOG_ERROR("Failed to start SoftAP");
    return;
  }

  IPAddress apIP = WiFi.softAPIP();
  String ipStr = apIP.toString();
  LOG_INFO("SSID: %s", ssid);
  LOG_INFO("AP IP address: %s", ipStr.c_str());

  /* Start DNS server for captive portal */
  dnsServer.start(53, "*", WiFi.softAPIP());

  /* Mount LittleFS */
  if (!LittleFS.begin()) 
  {
    LOG_ERROR("LittleFS mount failed");
    return;
  }

  /* Set up HTTP server */
  server_SetupStaticFiles();
  server_SetupWebServer();
  server.begin();
  LOG_INFO("HTTP server started");

  /* Set up WebSocket server */
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
  LOG_INFO("WebSocket server started");
}

/* [Function]: Wi-Fi通信イベント */
void Wifi_HandleNetworkEvent() 
{
  /* DNS request processing */
  dnsServer.processNextRequest();
  /* HTTP request */
  server.handleClient();
  /* WebSocket communication */
  webSocket.loop();
}

/* [Function]: Wi-Fiデータ送信 (ブロードキャスト) */
void Wifi_SendData(Sensor sensors[]) 
{
#if 0 /* error */
  SensorPacket packet = {
    (uint16_t)sensors[IPS_IDX_SIN_DATA].val,
    (uint16_t)sensors[IPS_IDX_COS_DATA].val,
    (uint16_t)sensors[IPS_IDX_SINN_DATA].val,
    (uint16_t)sensors[IPS_IDX_COSN_DATA].val,
    currentAngle
  };

  webSocket.broadcastBIN((uint8_t*)&packet, sizeof(packet));
#endif /* error */
  uint16_t A_val = sensors[IPS_IDX_SIN_DATA].val;
  uint16_t B_val = sensors[IPS_IDX_COS_DATA].val;
  uint16_t C_val = sensors[IPS_IDX_SINN_DATA].val;
  uint16_t D_val = sensors[IPS_IDX_COSN_DATA].val;
  float angle = currentAngle;
  uint8_t buffer[12];
  buffer[0] = (A_val >> 8) & 0xFF;
  buffer[1] = A_val & 0xFF;
  buffer[2] = (B_val >> 8) & 0xFF;
  buffer[3] = B_val & 0xFF;
  buffer[4] = (C_val >> 8) & 0xFF;
  buffer[5] = C_val & 0xFF;
  buffer[6] = (D_val >> 8) & 0xFF;
  buffer[7] = D_val & 0xFF;

  // floatをバイト列に変換（リトルエンディアン）
  uint8_t* angle_bytes = (uint8_t*)&angle;
  for (int idx = 0U; idx < 4U; idx++) 
  {
    buffer[8U + idx] = angle_bytes[idx];
  }
  webSocket.broadcastBIN(buffer, 12U);
}

/* [Function]: WebSocket接続 (Callback) */
void onWebSocketEvent(uint8_t client_num, WStype_t type, uint8_t* payload, size_t length) 
{
  switch (type) 
  {
    /* Client connected */
    case WStype_CONNECTED:
      LOG_INFO("Client [%u] connected", client_num);
      webSocket.sendTXT(client_num, "Welcome!");
      break;

    /* Client disconnected */
    case WStype_DISCONNECTED:
      LOG_INFO("Client [%u] disconnected", client_num);
      break;

    /* Received text message */
    case WStype_TEXT:
    /* Receiving binary data */
    case WStype_BIN:
      break;

    default:
      break;
  }
}

/* [Function]: LittleFS設定 */
static void server_SetupStaticFiles() 
{
  /* Set up the file on the web server */
  for (int idx = 0; idx < STATIC_FILE_PATH_COUNT; idx++) 
  {
    if (LittleFS.exists(gStaticFile[idx])) 
    {
      server.serveStatic(gStaticFile[idx], LittleFS, gStaticFile[idx]);
      LOG_INFO("Serving file: %s", gStaticFile[idx]);
    } 
    else 
    {
      LOG_ERROR("File not found: %s", gStaticFile[idx]);
    }
  }

  for (int idx = 0; idx < STATIC_DIR_PATH_COUNT; idx++) 
  {
    server.serveStatic(gStaticDir[idx], LittleFS, gStaticDir[idx]);
    LOG_INFO("Serving directory: %s", gStaticDir[idx]);
  }
}

/* [Function]: HTTP Webサーバのルーティング設定 */
static void server_SetupWebServer() 
{
  /* Captive Portal Detection */
  for (const char* path : gCaptivePortal) 
  {
    server.on(path, []() 
    {
      LOG_INFO("Captive Portal Redirect: %s", path);
      server.sendHeader("Location", "/portal.html", true);
      server.sendHeader("Cache-Control", "no-cache");
      server.sendHeader("Connection", "close");
      server.send(302, "text/plain", "");
    });
  }

  /* If NotFound, redirect to portal.html */
  server.onNotFound([]() 
  {
    LOG_INFO("Request: 404 - Not Found");
    server.sendHeader("Location", "/portal.html", true);
    server.sendHeader("Cache-Control", "no-cache");
    server.sendHeader("Connection", "close");
    server.send(302, "text/plain", "");
  });

  /* Normal top page access returns index.html */
  server.on("/", HTTP_GET, []() 
  {
    LOG_INFO("Request: Top page");
    File file = LittleFS.open("/index.html", "r");
    if (file) 
    {
      server.streamFile(file, "text/html");
      file.close();
    } 
    else 
    {
      server.send(500, "text/plain", "index.html not found");
      LOG_ERROR("HTTP 500 Error (Internal Server Error)");
    }
  });
}