/******************************************************************************
 *  File: IPS_Debug.h
 *  Description: Reads analog signals (sin and cos) from rotary encoder and
 *               calculates angle of rotation in degrees.
 *  Target: ESP32-S3-DEV-KIT-N16R8-M
 *  Date: 2025/XX/XX
 *  License: MinebeaMitsumi Inc.
 ******************************************************************************/

#ifndef IPS_DEBUG_H
#define IPS_DEBUG_H

//==============================================================================
// Configuration
//==============================================================================
// Log Output (Enabled = 1U, Disabled = 0U)
#define IPS_DEBUG                   (1U)
#define IPS_DEBUG_ENABLE_LOG_ERROR  (0U)
#define IPS_DEBUG_ENABLE_LOG_WARN   (0U)
#define IPS_DEBUG_ENABLE_LOG_INFO   (0U)
#define IPS_DEBUG_ENABLE_LOG_DEBUG  (1U)

//==============================================================================
// Macro
//==============================================================================
#if IPS_DEBUG

  #if IPS_DEBUG_ENABLE_LOG_ERROR
    #define LOG_ERROR(fmt, ...)  do { Serial.print("ERROR "); Serial.printf((fmt), ##__VA_ARGS__); Serial.println(); } while (0)
    #else
    #define LOG_ERROR(...)  do {} while (0)
  #endif

  #if IPS_DEBUG_ENABLE_LOG_WARN
    #define LOG_WARN(fmt, ...)  do { Serial.print("WARN "); Serial.printf((fmt), ##__VA_ARGS__); Serial.println(); } while (0)
  #else
    #define LOG_WARN(...)  do {} while (0)
  #endif

  #if IPS_DEBUG_ENABLE_LOG_INFO
    #define LOG_INFO(fmt, ...)  do { Serial.print("INFO "); Serial.printf((fmt), ##__VA_ARGS__); Serial.println(); } while (0)
  #else
    #define LOG_INFO(...)  do {} while (0)
  #endif

  #if IPS_DEBUG_ENABLE_LOG_DEBUG
    #define LOG_DEBUG(fmt, ...)  do { Serial.print("DEBUG "); Serial.printf((fmt), ##__VA_ARGS__); Serial.println(); } while (0)
  #else
    #define LOG_DEBUG(...)  do {} while (0)
  #endif

#else

  #define LOG_ERROR(...)
  #define LOG_WARN(...)
  #define LOG_INFO(...)
  #define LOG_DEBUG(...)

#endif

#endif // IPS_DEBUG_H
