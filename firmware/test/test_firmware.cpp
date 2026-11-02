#include "Arduino.h"
unsigned long g_ms = 100000;
int g_pin[40] = {0};
int g_pwm = 0;
SerialShim Serial;
int adcThumb = 1000, adcIndex = 1500, adcMiddle = 2000, adcRing = 2500, adcLittle = 3000;
int analogRead(int pin) {
  if (pin == 36) return adcThumb;
  if (pin == 34) return adcIndex;
  if (pin == 35) return adcMiddle;
  if (pin == 32) return adcRing;
  if (pin == 33) return adcLittle;
  return 0;
}
#include "../neurokinetics_glove/neurokinetics_glove.ino"
static int fails = 0;
#define CHECK(c, msg) do { if (!(c)) { printf("  FAIL: %s\n", msg); fails++; } } while (0)
void run(int ms) { for (int t = 0; t < ms; t += 5) { g_ms += 5; loop(); } }
void cmd(const char* s) { for (const char* p = s; *p; ++p) Serial.in.push_back(*p); Serial.in.push_back('\n'); run(20); }
bool contains(const char* s) { for (const auto& l : Serial.out) if (l.find(s) != std::string::npos) return true; return false; }
void fresh() { memset(g_pin, 0, sizeof(g_pin)); g_pwm = 0; Serial.out.clear(); Serial.in.clear(); Serial.line.clear(); adcThumb=1000; adcIndex=1500; adcMiddle=2000; adcRing=2500; adcLittle=3000; g_ms=100000; setup(); run(120); }
int main() {
  printf("1 five finger JSON stream\n"); fresh();
  CHECK(contains("\"angles\":[15.0,30.0,45.0,60.0,75.0]"), "all five angles in thumb-index-middle-ring-little order");
  CHECK(contains("\"calibrated\":true"), "configured ADC range reports calibrated");
  printf("2 motor starts and STOP halts immediately\n"); fresh(); cmd("CLOSE"); CHECK(g_pwm == MOTOR_POWER, "motor PWM active"); CHECK(g_pin[MOTOR_DIR1_PIN] == LOW && g_pin[MOTOR_DIR2_PIN] == HIGH, "close direction"); cmd("STOP"); CHECK(g_pwm == 0 && motorMode == IDLE, "motor stopped");
  printf("3 OPEN direction and jog timeout\n"); fresh(); cmd("OPEN"); CHECK(g_pin[MOTOR_DIR1_PIN] == HIGH && g_pin[MOTOR_DIR2_PIN] == LOW, "open direction"); run(2100); CHECK(g_pwm == 0 && motorMode == IDLE, "jog stops after timeout");
  printf("4 target movement stops near target\n"); fresh(); cmd("GOTO:30"); adcIndex = 1500; run(100); adcIndex = 1500; // stationary sensor: timeout safety must stop it
  run(4100); CHECK(g_pwm == 0 && motorMode == IDLE, "GOTO timeout stops motor if sensor does not move");
  printf(fails ? "\n%d CHECK(S) FAILED\n" : "\nALL TESTS PASSED\n", fails);
  return fails ? 1 : 0;
}
