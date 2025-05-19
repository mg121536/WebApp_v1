/******************************************************************************
 *  File: IPS_Wifi.h
 *  Description: Reads analog signals (sin and cos) from rotary encoder and
 *               calculates angle of rotation in degrees.
 *  Target: ESP32-S3-DEV-KIT-N16R8-M
 *  Date: 2025/XX/XX
 *  License: MinebeaMitsumi Inc.
 ******************************************************************************/

#ifndef IPS_WIFI_H
#define IPS_WIFI_H

//==============================================================================
// Include
//==============================================================================

#include <WiFi.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <WebSocketsServer.h>

//==============================================================================
// Macro
//==============================================================================

#define IPS_WIFI_SSID        ("NMB_AMR")
#define IPS_WIFI_PASSWARD    ("12345678")

#endif // IPS_WIFI_H
