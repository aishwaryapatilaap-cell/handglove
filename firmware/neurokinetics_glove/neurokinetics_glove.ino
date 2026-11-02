/*
  NEUROKINETICS - FIVE FINGER GLOVE
  ESP32 DevKit V1 + N20 motor driver + five potentiometers.

  Potentiometer pins (same as the user's bench-tested demo):
    Index GPIO34, Middle GPIO35, Ring GPIO32, Little GPIO33, Thumb GPIO36
  Motor driver: DIR1 GPIO2, DIR2 GPIO4, PWM GPIO5

  USB serial: 115200 baud. Emits one JSON object per line in the format
  expected by the NeuroKinetics web dashboard:
    {"angles":[thumb,index,middle,ring,little],"raw":1234,"motor":"idle","calibrated":true}
  Angles use the user's demo calibration range (ADC 500..3500 => 0..90 deg).

  Commands: OPEN, CLOSE (2-second safety jog), STOP, GOTO:45, PING.
  Motor is OFF at startup. Test the motor with the glove off the hand.
*/
#include <Arduino.h>
#include <math.h>

#define MOTOR_DIR1_PIN 2
#define MOTOR_DIR2_PIN 4
#define MOTOR_PWM_PIN 5
#define INDEX_POT_PIN 34
#define MIDDLE_POT_PIN 35
#define RING_POT_PIN 32
#define LITTLE_POT_PIN 33
#define THUMB_POT_PIN 36

static const int ADC_MIN = 500;
static const int ADC_MAX = 3500;
static const float MAX_ANGLE = 90.0f;
static const unsigned long JOG_MS = 2000;
static const unsigned long GOTO_TIMEOUT_MS = 4000;
static const unsigned long SAMPLE_MS = 20;
static const unsigned long STREAM_MS = 100;
static const int MOTOR_PWM_FREQ = 20000;
static const int MOTOR_PWM_RESOLUTION = 8;
static const int MOTOR_POWER = 255; // full 8-bit duty; keep motor unloaded for initial test

enum MotorMode { IDLE, OPENING, CLOSING, GOTO_OPENING, GOTO_CLOSING };
MotorMode motorMode = IDLE;
unsigned long moveStarted = 0, lastSample = 0, lastStream = 0;
float angles[5] = {0, 0, 0, 0, 0}; // [thumb,index,middle,ring,little]
int rawIndex = 0;
float targetAngle = 0;
char commandBuffer[40];
uint8_t commandLength = 0;

int readAverage(int pin) {
  uint32_t total = 0;
  for (int i = 0; i < 8; ++i) total += analogRead(pin);
  return (int)(total / 8);
}
float toAngle(int raw) {
  float a = ((float)(raw - ADC_MIN) / (float)(ADC_MAX - ADC_MIN)) * MAX_ANGLE;
  return constrain(a, 0.0f, MAX_ANGLE);
}
void motorStop() {
  ledcWrite(MOTOR_PWM_PIN, 0);
  digitalWrite(MOTOR_DIR1_PIN, LOW);
  digitalWrite(MOTOR_DIR2_PIN, LOW);
  motorMode = IDLE;
}
void motorOpen() {
  digitalWrite(MOTOR_DIR1_PIN, HIGH);
  digitalWrite(MOTOR_DIR2_PIN, LOW);
  ledcWrite(MOTOR_PWM_PIN, MOTOR_POWER);
  motorMode = OPENING;
  moveStarted = millis();
}
void motorClose() {
  digitalWrite(MOTOR_DIR1_PIN, LOW);
  digitalWrite(MOTOR_DIR2_PIN, HIGH);
  ledcWrite(MOTOR_PWM_PIN, MOTOR_POWER);
  motorMode = CLOSING;
  moveStarted = millis();
}
const char* motorText() {
  if (motorMode == OPENING || motorMode == GOTO_OPENING) return "opening";
  if (motorMode == CLOSING || motorMode == GOTO_CLOSING) return "closing";
  return "idle";
}
void sampleSensors() {
  int rawThumb = readAverage(THUMB_POT_PIN);
  rawIndex = readAverage(INDEX_POT_PIN);
  int rawMiddle = readAverage(MIDDLE_POT_PIN);
  int rawRing = readAverage(RING_POT_PIN);
  int rawLittle = readAverage(LITTLE_POT_PIN);
  angles[0] = toAngle(rawThumb);
  angles[1] = toAngle(rawIndex);
  angles[2] = toAngle(rawMiddle);
  angles[3] = toAngle(rawRing);
  angles[4] = toAngle(rawLittle);
}
void sendEvent(const char* eventName) {
  Serial.print("{\"event\":\""); Serial.print(eventName);
  Serial.print("\",\"angle\":"); Serial.print(angles[1], 1); Serial.println("}");
}
void streamReading() {
  Serial.print("{\"angles\":[");
  for (int i = 0; i < 5; ++i) { if (i) Serial.print(','); Serial.print(angles[i], 1); }
  Serial.print("],\"raw\":"); Serial.print(rawIndex);
  Serial.print(",\"motor\":\""); Serial.print(motorText());
  Serial.println("\",\"calibrated\":true}");
}
void startGoto(float target) {
  targetAngle = constrain(target, 0.0f, 90.0f);
  if (fabsf(targetAngle - angles[1]) < 0.8f) { motorStop(); sendEvent("REACHED"); return; }
  if (targetAngle > angles[1]) {
    motorClose(); motorMode = GOTO_CLOSING;
  } else {
    motorOpen(); motorMode = GOTO_OPENING;
  }
}
void handleCommand(char* cmd) {
  if (!strcmp(cmd, "STOP")) { motorStop(); sendEvent("STOPPED"); }
  else if (!strcmp(cmd, "OPEN")) motorOpen();
  else if (!strcmp(cmd, "CLOSE")) motorClose();
  else if (!strcmp(cmd, "PING")) { sampleSensors(); sendEvent("PONG"); }
  else if (!strncmp(cmd, "GOTO:", 5)) startGoto(atof(cmd + 5));
  else sendEvent("UNKNOWN_COMMAND");
}
void readCommands() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      commandBuffer[commandLength] = '\0';
      if (commandLength) handleCommand(commandBuffer);
      commandLength = 0;
    } else if (commandLength < sizeof(commandBuffer) - 1) commandBuffer[commandLength++] = c;
    else commandLength = 0;
  }
}
void updateMotor() {
  if (motorMode == IDLE) return;
  unsigned long elapsed = millis() - moveStarted;
  if (motorMode == OPENING || motorMode == CLOSING) {
    if (elapsed >= JOG_MS) { motorStop(); sendEvent("JOG_DONE"); }
  } else {
    bool closing = motorMode == GOTO_CLOSING;
    bool reached = closing ? angles[1] >= targetAngle - 0.8f : angles[1] <= targetAngle + 0.8f;
    if (reached) { motorStop(); sendEvent("REACHED"); }
    else if (elapsed >= GOTO_TIMEOUT_MS) { motorStop(); sendEvent("TIMEOUT"); }
  }
}
void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_DIR1_PIN, OUTPUT);
  pinMode(MOTOR_DIR2_PIN, OUTPUT);
  pinMode(MOTOR_PWM_PIN, OUTPUT);
  pinMode(INDEX_POT_PIN, INPUT);
  pinMode(MIDDLE_POT_PIN, INPUT);
  pinMode(RING_POT_PIN, INPUT);
  pinMode(LITTLE_POT_PIN, INPUT);
  pinMode(THUMB_POT_PIN, INPUT);
  analogReadResolution(12);
  if (!ledcAttach(MOTOR_PWM_PIN, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION)) {
    Serial.println("{\"event\":\"PWM_INIT_FAILED\"}");
    while (true) { digitalWrite(MOTOR_DIR1_PIN, LOW); digitalWrite(MOTOR_DIR2_PIN, LOW); delay(100); }
  }
  motorStop();
  sampleSensors();
  Serial.println("{\"event\":\"READY\"}");
}
void loop() {
  readCommands();
  unsigned long now = millis();
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;
    sampleSensors();
    updateMotor();
  }
  if (now - lastStream >= STREAM_MS) {
    lastStream = now;
    streamReading();
  }
}
