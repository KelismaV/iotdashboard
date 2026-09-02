# ESP32 IoT Real-Time Sensor Dashboard

Hệ thống giám sát cảm biến ESP32 thời gian thực với React, Tailwind CSS, Node.js Express, SQLite Database & Server-Sent Events (SSE).

---

## 🚀 Hướng dẫn Chạy Dự Án (Quick Start)

### 1. Cài đặt các thư viện (Dependencies)
Mở Terminal trong thư mục dự án và chạy lệnh:
```bash
npm install
```

### 2. Khởi chạy hệ thống (Backend + Frontend)
Chạy lệnh duy nhất sau để bật cả Server Node.js (cổng 5000) và Web React (cổng 5173/5174):
```bash
npm run dev
```

### 3. Mở trang web
Truy cập trình duyệt tại địa chỉ:
👉 **http://localhost:5173/** (hoặc **http://localhost:5174/**)

---

## 🛠️ Cấu trúc dự án

- `src/`: Mã nguồn Giao diện React Dashboard (KPI Cards, Recharts, Warning Panel, Prediction Model).
- `server/server.js`: Node.js Express REST API & Server-Sent Events (SSE) stream.
- `server/db.js`: Cơ sở dữ liệu SQLite3 lưu trữ 340.000+ bản ghi tốc độ siêu tốc (< 1ms).
- `server/seedGoogleSheets.js`: Tự động di dời dữ liệu lịch sử từ Google Sheets sang SQLite.
- `esp32_firmware/esp32_sensor_logger.ino`: Mã nguồn Arduino C++ cho vi điều khiển ESP32.

---

## 📡 API Endpoints cho ESP32

- **POST /api/sensor-data**: Đẩy dữ liệu trực tiếp từ ESP32
  ```json
  {
    "temp": 29.5,
    "humidity": 80.0,
    "mq2": 450,
    "mq3": 520,
    "mq4": 85,
    "status": "Success"
  }
  ```
