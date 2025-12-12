#include <WiFi.h>
#include <ESP32Servo.h>
#include <DHT.h>
#include <FirebaseESP32.h>

// =================== WIFI ===================
const char* ssid = "wifi";         // REPLACE WITH YOUR WIFI NAME
const char* password = "12345678"; // REPLACE WITH YOUR PASSWORD

// =================== FIREBASE ===================
#define DATABASE_URL "https://kissan-agriculture-sih-default-rtdb.asia-southeast1.firebasedatabase.app"
#define DATABASE_SECRET "RudAdT0IW4GEPXx3kT8SH0CoqqpQYjC9ItfkNzdS"

// =================== HARDWARE PINS ===================
#define DISC_SERVO_PIN 13
#define FLAP_SERVO_PIN 15 // Ensure Servo can handle 90deg

// RACK MOTORS (L298N)
#define MOTOR_A_FWD 26
#define MOTOR_A_BWD 27
#define MOTOR_B_FWD 14
#define MOTOR_B_BWD 12
#define MOTOR_ENA 25
#define MOTOR_ENB 33

// SENSORS & PUMP
#define DHTPIN 4
#define DHTTYPE DHT11
#define SOIL_MOISTURE_PIN 34
#define PUMP_RELAY_PIN 32

// =================== SETTINGS ===================
#define SERVO_STOP_VAL 90 
#define RELAY_ON_LOGIC HIGH
#define RELAY_OFF_LOGIC LOW
#define DISC_STEP_TIME 300 

// Pump Calc: ~100 L/H => 0.0277 mL/ms
const float PUMP_FLOW_RATE_MS = 0.0277; 
const float WATER_PER_PERCENT = 10.0; // Calibration: mL needed per 1% deficit

// =================== OBJECTS ===================
Servo discServo;
Servo flapServo;
DHT dht(DHTPIN, DHTTYPE);
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// =================== VARIABLES ===================
String lastCommand = "IDLE";
float calculatedDuration = 0; 
bool isPumping = false;
unsigned long pumpStartTime = 0;

void setup() {
  Serial.begin(115200);

  // PINS
  pinMode(MOTOR_A_FWD, OUTPUT); pinMode(MOTOR_A_BWD, OUTPUT);
  pinMode(MOTOR_B_FWD, OUTPUT); pinMode(MOTOR_B_BWD, OUTPUT);
  pinMode(MOTOR_ENA, OUTPUT); pinMode(MOTOR_ENB, OUTPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, RELAY_OFF_LOGIC);

  // SERVOS
  discServo.setPeriodHertz(50); discServo.attach(DISC_SERVO_PIN, 500, 2400);
  flapServo.setPeriodHertz(50); flapServo.attach(FLAP_SERVO_PIN, 500, 2400);
  discServo.write(SERVO_STOP_VAL);
  flapServo.write(0); // Closed

  dht.begin();

  // WIFI
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.println(" Connected!");

  // FIREBASE
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  firebaseData.setBSSLBufferSize(2048, 1024); // Increased RX buffer for JSON
  firebaseData.setResponseSize(2048);
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. POLL COMMANDS
  if (Firebase.ready()) {
    if (Firebase.getString(firebaseData, "/rover/controls/manual_cmd")) {
      String cmd = firebaseData.stringData();
      if (cmd != "IDLE" && cmd != lastCommand) {
        lastCommand = cmd;
        executeCommand(cmd);
      }
    }
  }

  // 2. PUMP TIMER
  if (isPumping && (currentMillis - pumpStartTime >= calculatedDuration)) {
    digitalWrite(PUMP_RELAY_PIN, RELAY_OFF_LOGIC);
    isPumping = false;
    Serial.println("💧 Pump OFF.");
    // Auto-Close Flap after watering? Optional.
    flapServo.write(0); 
    resetCommand();
  }
}

void executeCommand(String cmd) {
  Serial.println("CMD: " + cmd);

  // --- STEP 1: SEED ---
  if (cmd == "STEP1") {
    discServo.write(180); delay(DISC_STEP_TIME); discServo.write(SERVO_STOP_VAL);
    resetCommand();
  }

  // --- STEP 2: RACK DOWN ---
  else if (cmd == "RACK_DOWN") {
    digitalWrite(MOTOR_A_FWD, LOW); digitalWrite(MOTOR_A_BWD, HIGH);
    digitalWrite(MOTOR_B_FWD, HIGH); digitalWrite(MOTOR_B_BWD, LOW);
    digitalWrite(MOTOR_ENA, HIGH);  digitalWrite(MOTOR_ENB, HIGH);
  }

  // --- STEP 3: OPEN FLAP ---
  else if (cmd == "STEP3_FLAP_OPEN") {
    Serial.println("Opening Flap...");
    flapServo.write(90); 
    resetCommand();
  }

  // --- STEP 4: SENSE & CALC (INTELLIGENCE) ---
  else if (cmd == "STEP4_SENSE") {
    Serial.println("Fetching DB Data & Sensing...");

    // 1. Get Selected Crop & Stage
    String crop = "", stage = "";
    if(Firebase.getString(firebaseData, "/rover/selected_crop")) crop = firebaseData.stringData();
    if(Firebase.getString(firebaseData, "/rover/selected_stage")) stage = firebaseData.stringData();

    if(crop == "" || stage == "") { Serial.println("❌ No Crop Selected!"); resetCommand(); return; }

    // 2. Build Path: /crops/{crop}/stages/{stage}
    String basePath = "/crops/" + crop + "/stages/" + stage;
    
    // 3. Fetch Thresholds
    float db_moist_min = 0, db_temp_max = 0, db_hum_max = 0;
    if(Firebase.getFloat(firebaseData, basePath + "/moisture_min")) db_moist_min = firebaseData.floatData();
    if(Firebase.getFloat(firebaseData, basePath + "/temp_max")) db_temp_max = firebaseData.floatData();
    if(Firebase.getFloat(firebaseData, basePath + "/humidity_max")) db_hum_max = firebaseData.floatData();

    // 4. Read Sensors
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    float rawM = analogRead(SOIL_MOISTURE_PIN);
    float m = map(rawM, 4095, 1500, 0, 100); m = constrain(m, 0, 100);

    // 5. Comparison Logic
    Serial.printf("Crop: %s | Stage: %s\n", crop.c_str(), stage.c_str());
    Serial.printf("Temp: %.1f (Limit: %.1f) -> %s\n", t, db_temp_max, (t > db_temp_max ? "HIGH" : "OK"));
    Serial.printf("Hum: %.1f (Limit: %.1f) -> %s\n", h, db_hum_max, (h > db_hum_max ? "HIGH" : "OK"));
    Serial.printf("Moisture: %.1f (Min Needed: %.1f)\n", m, db_moist_min);

    // 6. Calculate Water Time (Only if Moisture < DB Min)
    if (m < db_moist_min) {
      float deficit = db_moist_min - m;
      float waterNeeded = deficit * WATER_PER_PERCENT;
      calculatedDuration = waterNeeded / PUMP_FLOW_RATE_MS;
      
      // Limits
      if(calculatedDuration > 10000) calculatedDuration = 10000; 
      if(calculatedDuration < 1000) calculatedDuration = 1000;
      
      Serial.print("✅ Deficit Found! Pump Time: "); Serial.println(calculatedDuration);
    } else {
      calculatedDuration = 0;
      Serial.println("✅ Soil is sufficient. No water needed.");
    }

    resetCommand();
  }

  // --- STEP 5: CLOSE FLAP (NEW) ---
  else if (cmd == "STEP5_FLAP_CLOSE") {
    Serial.println("Closing Flap...");
    flapServo.write(0);
    resetCommand();
  }

  // --- STEP 6: RACK UP ---
  else if (cmd == "RACK_UP") {
    digitalWrite(MOTOR_A_FWD, HIGH); digitalWrite(MOTOR_A_BWD, LOW);
    digitalWrite(MOTOR_B_FWD, LOW); digitalWrite(MOTOR_B_BWD, HIGH);
    digitalWrite(MOTOR_ENA, HIGH);  digitalWrite(MOTOR_ENB, HIGH);
  }

  // --- STOP RACK ---
  else if (cmd == "RACK_STOP") {
    digitalWrite(MOTOR_ENA, LOW); digitalWrite(MOTOR_ENB, LOW);
    digitalWrite(MOTOR_A_FWD, LOW); digitalWrite(MOTOR_A_BWD, LOW);
    digitalWrite(MOTOR_B_FWD, LOW); digitalWrite(MOTOR_B_BWD, LOW);
  }

  // --- STEP 7: WATER ---
  else if (cmd == "STEP7_WATER") {
    if (calculatedDuration > 0) {
      Serial.println("💦 Starting Pump...");
      digitalWrite(PUMP_RELAY_PIN, RELAY_ON_LOGIC);
      pumpStartTime = millis();
      isPumping = true;
    } else {
      Serial.println("⚠ Calc Time is 0. Pump Skipped.");
      resetCommand(); // Reset immediately if skipped
    }
  }
}

void resetCommand() {
  lastCommand = "IDLE";
  Firebase.setString(firebaseData, "/rover/controls/manual_cmd", "IDLE");
}