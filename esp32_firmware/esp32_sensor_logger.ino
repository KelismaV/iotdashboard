/*
 * =====================================================================================
 * ESP32 REAL-TIME SENSOR STATION FIRMWARE (#TD3)
 * MÃ NGUỒN C++ CHO THIẾT BỊ ESP32 GỬI DỮ LIỆU CẢM BIẾN VỀ NODE.JS BACKEND
 * =====================================================================================
 * Thư viện cần cài đặt trên Arduino IDE:
 * 1. DHT sensor library (by Adafruit)
 * 2. ArduinoJson (by Benoit Blanchon)
 * -------------------------------------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

// -------------------------------------------------------------------------------------
// 1. CẤU HÌNH WI-FI & SERVER BACKEND
// -------------------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_NAME";        // Thay tên Wi-Fi của bạn
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";    // Thay mật khẩu Wi-Fi

// Thay <SERVER_IP> bằng địa chỉ IP máy tính chạy Node.js Backend (Ví dụ: http://192.168.1.10:5000/api/sensor-data)
const char* SERVER_URL    = "http://192.168.1.100:5000/api/sensor-data";

// -------------------------------------------------------------------------------------
// 2. CẤU HÌNH CHÂN CẢM BIẾN (PIN DEFINITIONS)
// -------------------------------------------------------------------------------------
#define DHTPIN 4          // Chân Data của cảm biến Nhiệt độ / Độ ẩm DHT11 hoặc DHT22
#define DHTTYPE DHT22     // Loại cảm biến: DHT11 hoặc DHT22

#define MQ2_PIN 34        // Chân Analog ADC của cảm biến khí Gas/Khói MQ-2
#define MQ3_PIN 35        // Chân Analog ADC của cảm biến nồng độ cồn MQ-3
#define MQ4_PIN 32        // Chân Analog ADC của cảm biến khí Methane MQ-4

DHT dht(DHTPIN, DHTTYPE);

// Khoảng thời gian đọc & gửi dữ liệu (Tính bằng Mili-giây, ví dụ 5000ms = 5 giây)
const unsigned long SEND_INTERVAL_MS = 5000;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==========================================");
  Serial.println("🚀 ESP32 SENSOR STATION #TD3 STARTING...");
  Serial.println("==========================================");

  // Khởi tạo cảm biến
  dht.begin();
  pinMode(MQ2_PIN, INPUT);
  pinMode(MQ3_PIN, INPUT);
  pinMode(MQ4_PIN, INPUT);

  // Kết nối Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ Wi-Fi Connected Successfully!");
  Serial.print("📡 ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("------------------------------------------");
}

void loop() {
  // Kiểm tra thời gian chu kỳ gửi dữ liệu
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    sendSensorDataData();
  }
}

void sendSensorDataData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Wi-Fi disconnected! Reconnecting...");
    WiFi.reconnect();
    return;
  }

  // Đọc dữ liệu từ các cảm biến
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Kiểm tra nếu cảm biến DHT báo lỗi
  if (isnan(h) || isnan(t)) {
    Serial.println("❌ Error reading from DHT sensor!");
    t = 25.0; // Giá trị mặc định khi lỗi
    h = 60.0;
  }

  // Đọc giá trị Analog từ cảm biến MQ (Chuyển đổi ADC 12-bit 0-4095)
  int rawMq2 = analogRead(MQ2_PIN);
  int rawMq3 = analogRead(MQ3_PIN);
  int rawMq4 = analogRead(MQ4_PIN);

  // Quy đổi giá trị đọc thô sang nồng độ PPM ước tính
  float mq2Ppm = map(rawMq2, 0, 4095, 200, 1000);
  float mq3Ppm = map(rawMq3, 0, 4095, 300, 1000);
  float mq4Ppm = map(rawMq4, 0, 4095, 50, 500);

  // Đóng gói JSON Payload
  StaticJsonDocument<256> doc;
  doc["temp"] = round(t * 10.0) / 10.0;
  doc["humidity"] = round(h * 10.0) / 10.0;
  doc["mq2"] = round(mq2Ppm);
  doc["mq3"] = round(mq3Ppm);
  doc["mq4"] = round(mq4Ppm);
  doc["status"] = "Success";

  String jsonString;
  serializeJson(doc, jsonString);

  // Gửi HTTP POST request về Node.js Backend
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  Serial.print("📤 Sending JSON to Backend: ");
  Serial.println(jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("✅ Server Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("📥 Payload Response: ");
    Serial.println(response);
  } else {
    Serial.print("❌ HTTP POST Failed Error Code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
  Serial.println("------------------------------------------");
}
