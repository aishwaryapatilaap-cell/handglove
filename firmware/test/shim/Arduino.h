#pragma once
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include <cmath>
#include <string>
#include <vector>
#include <deque>
#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
extern unsigned long g_ms;
extern int g_pin[40];
extern int g_pwm;
inline unsigned long millis() { return g_ms; }
inline void delay(unsigned long ms) { g_ms += ms; }
inline void pinMode(int, int) {}
inline void digitalWrite(int p, int v) { g_pin[p] = v; }
inline int constrain(int x, int lo, int hi) { return x < lo ? lo : (x > hi ? hi : x); }
inline float constrain(float x, float lo, float hi) { return x < lo ? lo : (x > hi ? hi : x); }
inline void analogReadResolution(int) {}
inline bool ledcAttach(int, int, int) { return true; }
inline void ledcWrite(int, int duty) { g_pwm = duty; }
int analogRead(int pin);
struct SerialShim {
  std::vector<std::string> out; std::deque<char> in; std::string line;
  void begin(int) {}
  void print(const char* s) { line += s; }
  void print(char c) { line += c; }
  void print(int n) { line += std::to_string(n); }
  void print(float n, int precision = 2) { char b[40]; snprintf(b, sizeof b, "%.*f", precision, n); line += b; }
  void println(const char* s) { line += s; out.push_back(line); line.clear(); }
  void println() { out.push_back(line); line.clear(); }
  int available() { return (int)in.size(); }
  int read() { if (in.empty()) return -1; char c = in.front(); in.pop_front(); return c; }
};
extern SerialShim Serial;
