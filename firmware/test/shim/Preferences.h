#pragma once
#include <map>
#include <string>
class Preferences {
 public:
  static std::map<std::string, int>& store() { static std::map<std::string, int> m; return m; }
  bool begin(const char*, bool) { return true; }
  int getInt(const char* k, int d) { auto it = store().find(k); return it == store().end() ? d : it->second; }
  void putInt(const char* k, int v) { store()[k] = v; }
};
