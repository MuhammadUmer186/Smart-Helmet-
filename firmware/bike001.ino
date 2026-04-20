#define TINY_GSM_MODEM_SIM800
#define TINY_GSM_RX_BUFFER 1024

#include <TinyGsmClient.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>

// =====================================================
// TTGO T-CALL / SIM800 PINS
// =====================================================
#define MODEM_PWKEY      4
#define MODEM_RST        5
#define MODEM_POWER_ON   23
#define MODEM_TX         27
#define MODEM_RX         26

// =====================================================
// USER PINS
// =====================================================
#define RELAY_PIN           25
#define EMERGENCY_BTN_PIN   18
#define MAIN_BAT_ADC_PIN    34

// =====================================================
// NEO-6M GPS PINS (Serial2)
// NEO-6M TX  ->  ESP32 GPIO16
// NEO-6M RX  ->  ESP32 GPIO17
// =====================================================
#define GPS_RX_PIN   16
#define GPS_TX_PIN   17
#define GPS_BAUD     9600

// =====================================================
// DEVICE / NETWORK CONFIG
// =====================================================
const char DEVICE_ID[] = "BIKE-001";
const char APN[]       = "ufone.pinternet";
const char GPRS_USER[] = "";
const char GPRS_PASS[] = "";

// =====================================================
// SERVER CONFIG
// =====================================================
const char SERVER_HOST[] = "helmet.aiotstudio.online";
const int  SERVER_PORT   = 80;

String contactPath  = String("/api/public/contact/")  + DEVICE_ID;
String locationPath = String("/api/public/location/") + DEVICE_ID;

// =====================================================
// TIMINGS
// =====================================================
const unsigned long BTN_LONGPRESS_MS         = 1500;
const unsigned long MODEM_BOOT_DELAY_MS      = 8000;
const unsigned long MODEM_NETWORK_TIMEOUT_MS = 30000;
const unsigned long CONTACT_REFRESH_MS       = 60000;
const unsigned long LOCATION_SEND_MS         = 10000;   // send location every 10s
const unsigned long HTTP_RESPONSE_TIMEOUT_MS = 20000;
const unsigned long GPS_WAIT_MS              = 5000;    // wait up to 5s for fresh GPS fix

// =====================================================
// SERIALS
// =====================================================
#define SerialMon Serial
#define SerialAT  Serial1
#define SerialGPS Serial2

// =====================================================
// OBJECTS
// =====================================================
TinyGsm       modem(SerialAT);
TinyGsmClient gsmClient(modem);
TinyGPSPlus   gps;

// =====================================================
// GLOBALS
// =====================================================
bool   gsmReady  = false;
bool   fetchNow  = false;
String emergencyPhone      = "";
unsigned long lastContactFetchMs  = 0;
unsigned long lastLocationSendMs  = 0;
uint32_t activeBaud = 0;

// =====================================================
// MODEM POWER
// =====================================================
void modemPowerPinsInit() {
  pinMode(MODEM_PWKEY, OUTPUT);
  pinMode(MODEM_RST, OUTPUT);
  pinMode(MODEM_POWER_ON, OUTPUT);
  digitalWrite(MODEM_PWKEY, LOW);
  digitalWrite(MODEM_RST, HIGH);
  digitalWrite(MODEM_POWER_ON, LOW);
}

void powerOnModem() {
  SerialMon.println("[GSM] Enabling modem power rail");
  digitalWrite(MODEM_POWER_ON, HIGH);
  delay(300);
  SerialMon.println("[GSM] Sending PWKEY pulse");
  digitalWrite(MODEM_PWKEY, HIGH);
  delay(1200);
  digitalWrite(MODEM_PWKEY, LOW);
  delay(MODEM_BOOT_DELAY_MS);
}

void powerOffModem() {
  SerialMon.println("[GSM] Powering modem OFF");
  digitalWrite(MODEM_PWKEY, HIGH);
  delay(1500);
  digitalWrite(MODEM_PWKEY, LOW);
  delay(3000);
  digitalWrite(MODEM_POWER_ON, LOW);
}

// =====================================================
// BAUD DETECT
// =====================================================
bool testATAtBaud(uint32_t baud) {
  SerialAT.end();
  delay(200);
  SerialAT.begin(baud, SERIAL_8N1, MODEM_RX, MODEM_TX);
  delay(500);
  for (int i = 0; i < 5; i++) {
    while (SerialAT.available()) SerialAT.read();
    SerialAT.println("AT");
    String resp = "";
    unsigned long t = millis();
    while (millis() - t < 800) {
      while (SerialAT.available()) resp += (char)SerialAT.read();
    }
    if (resp.indexOf("OK") >= 0) {
      SerialMon.print("[GSM] AT OK at baud "); SerialMon.println(baud);
      return true;
    }
  }
  return false;
}

// =====================================================
// GSM + GPRS INIT
// =====================================================
bool initModemAndGprs() {
  powerOnModem();
  const uint32_t bauds[] = {9600, 115200, 57600, 38400, 19200};
  activeBaud = 0;
  for (uint8_t i = 0; i < 5; i++) {
    if (testATAtBaud(bauds[i])) { activeBaud = bauds[i]; break; }
  }
  if (!activeBaud) { SerialMon.println("[ERR] Modem no AT response"); return false; }

  if (!modem.init()) { SerialMon.println("[ERR] modem.init() failed"); return false; }
  SerialMon.print("[GSM] "); SerialMon.println(modem.getModemInfo());

  if (!modem.waitForNetwork(MODEM_NETWORK_TIMEOUT_MS)) { SerialMon.println("[ERR] No network"); return false; }
  if (!modem.gprsConnect(APN, GPRS_USER, GPRS_PASS))   { SerialMon.println("[ERR] GPRS failed"); return false; }
  if (!modem.isGprsConnected())                         { SerialMon.println("[ERR] GPRS not up"); return false; }

  SerialMon.print("[GSM] IP: "); SerialMon.println(modem.localIP());
  return true;
}

void shutdownGsm() {
  if (modem.isGprsConnected()) modem.gprsDisconnect();
  powerOffModem();
  gsmReady = false;
}

// =====================================================
// RAW HTTP HELPER
// =====================================================
String rawGet(const String& path) {
  gsmClient.stop();
  delay(300);
  if (!gsmClient.connect(SERVER_HOST, SERVER_PORT)) return "";

  gsmClient.print("GET " + path + " HTTP/1.1\r\n");
  gsmClient.print(String("Host: ") + SERVER_HOST + "\r\n");
  gsmClient.print("Accept: application/json\r\n");
  gsmClient.print("Connection: close\r\n\r\n");

  String raw = "";
  unsigned long t = millis();
  while (millis() - t < HTTP_RESPONSE_TIMEOUT_MS) {
    while (gsmClient.available()) raw += (char)gsmClient.read();
    if (!gsmClient.connected() && !gsmClient.available()) break;
    delay(10);
  }
  gsmClient.stop();
  return raw;
}

String rawPost(const String& path, const String& body) {
  gsmClient.stop();
  delay(300);
  if (!gsmClient.connect(SERVER_HOST, SERVER_PORT)) return "";

  gsmClient.print("POST " + path + " HTTP/1.1\r\n");
  gsmClient.print(String("Host: ") + SERVER_HOST + "\r\n");
  gsmClient.print("Content-Type: application/json\r\n");
  gsmClient.print("Accept: application/json\r\n");
  gsmClient.print("Connection: close\r\n");
  gsmClient.print("Content-Length: " + String(body.length()) + "\r\n\r\n");
  gsmClient.print(body);

  String raw = "";
  unsigned long t = millis();
  while (millis() - t < HTTP_RESPONSE_TIMEOUT_MS) {
    while (gsmClient.available()) raw += (char)gsmClient.read();
    if (!gsmClient.connected() && !gsmClient.available()) break;
    delay(10);
  }
  gsmClient.stop();
  return raw;
}

String extractBody(const String& raw) {
  int i = raw.indexOf("\r\n\r\n");
  return i >= 0 ? raw.substring(i + 4) : "";
}

// =====================================================
// FETCH CONTACT
// =====================================================
bool httpGetContact() {
  SerialMon.println("[CONTACT] Fetching...");
  String body = extractBody(rawGet(contactPath));
  if (!body.length()) { SerialMon.println("[CONTACT] Empty response"); return false; }

  DynamicJsonDocument doc(512);
  if (deserializeJson(doc, body)) { SerialMon.println("[CONTACT] JSON parse failed"); return false; }

  String phone = doc["data"]["phone_number"] | "";
  if (phone.length() < 6) { SerialMon.println("[CONTACT] Invalid phone"); return false; }

  emergencyPhone = phone;
  SerialMon.print("[CONTACT] Loaded: "); SerialMon.println(emergencyPhone);
  return true;
}

// =====================================================
// GPS READ
// =====================================================
bool readGPS(double& lat, double& lng, double& speed) {
  unsigned long t = millis();
  while (millis() - t < GPS_WAIT_MS) {
    while (SerialGPS.available()) gps.encode(SerialGPS.read());
    if (gps.location.isUpdated() && gps.location.isValid()) {
      lat   = gps.location.lat();
      lng   = gps.location.lng();
      speed = gps.speed.kmph();
      return true;
    }
    delay(10);
  }
  // Return last known fix if available
  if (gps.location.isValid()) {
    lat   = gps.location.lat();
    lng   = gps.location.lng();
    speed = gps.speed.kmph();
    SerialMon.println("[GPS] Using last known fix");
    return true;
  }
  SerialMon.println("[GPS] No fix");
  return false;
}

// =====================================================
// SEND LOCATION
// =====================================================
bool httpPostLocation() {
  double lat, lng, speed;
  if (!readGPS(lat, lng, speed)) return false;

  SerialMon.print("[GPS] Lat: "); SerialMon.print(lat, 6);
  SerialMon.print(" Lng: "); SerialMon.print(lng, 6);
  SerialMon.print(" Speed: "); SerialMon.println(speed, 1);

  DynamicJsonDocument doc(256);
  doc["latitude"]   = lat;
  doc["longitude"]  = lng;
  doc["speed_kmph"] = speed;
  doc["gps_valid"]  = true;
  String body;
  serializeJson(doc, body);

  String raw = rawPost(locationPath, body);
  if (!raw.length()) { SerialMon.println("[LOC] No response"); return false; }

  bool ok = raw.indexOf("200 OK") >= 0;
  SerialMon.println(ok ? "[LOC] Sent OK" : "[LOC] Send failed");
  return ok;
}

// =====================================================
// BUTTON
// =====================================================
void handleFetchButton() {
  static bool lastState = HIGH;
  static unsigned long pressedAt = 0;
  bool nowState = digitalRead(EMERGENCY_BTN_PIN);
  if (lastState == HIGH && nowState == LOW) pressedAt = millis();
  if (lastState == LOW  && nowState == HIGH) {
    if (millis() - pressedAt >= BTN_LONGPRESS_MS) {
      SerialMon.println("[BTN] Manual fetch triggered");
      fetchNow = true;
    }
  }
  lastState = nowState;
}

// =====================================================
// SETUP
// =====================================================
void setup() {
  SerialMon.begin(115200);
  delay(1000);
  SerialMon.println("=== BIKE UNIT BOOT ===");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  pinMode(EMERGENCY_BTN_PIN, INPUT_PULLUP);
  pinMode(MAIN_BAT_ADC_PIN, INPUT);
  analogReadResolution(12);

  // GPS
  SerialGPS.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  SerialMon.println("[GPS] NEO-6M initialized");

  modemPowerPinsInit();

  if (!initModemAndGprs()) {
    SerialMon.println("[BOOT] GSM init failed");
    shutdownGsm();
  } else {
    gsmReady = true;
    SerialMon.println("[BOOT] GSM ready");
    httpGetContact();
    lastContactFetchMs = millis();
    lastLocationSendMs = millis();
  }

  SerialMon.println("[BOOT] Setup done");
}

// =====================================================
// LOOP
// =====================================================
void loop() {
  // Feed GPS continuously
  while (SerialGPS.available()) gps.encode(SerialGPS.read());

  handleFetchButton();

  if (fetchNow) {
    fetchNow = false;
    httpGetContact();
    lastContactFetchMs = millis();
  }

  if (gsmReady) {
    // Refresh contact every 60s
    if (millis() - lastContactFetchMs >= CONTACT_REFRESH_MS) {
      httpGetContact();
      lastContactFetchMs = millis();
    }
    // Send location every 10s
    if (millis() - lastLocationSendMs >= LOCATION_SEND_MS) {
      httpPostLocation();
      lastLocationSendMs = millis();
    }
  }

  static unsigned long lastDebug = 0;
  if (millis() - lastDebug >= 5000) {
    lastDebug = millis();
    SerialMon.print("[DEBUG] GSM: ");    SerialMon.print(gsmReady ? "YES" : "NO");
    SerialMon.print(" | Contact: ");     SerialMon.print(emergencyPhone.length() ? emergencyPhone : "NONE");
    SerialMon.print(" | GPS sats: ");    SerialMon.print(gps.satellites.value());
    SerialMon.print(" | GPS valid: ");   SerialMon.println(gps.location.isValid() ? "YES" : "NO");
  }

  delay(20);
}
