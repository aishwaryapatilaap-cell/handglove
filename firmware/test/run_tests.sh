#!/bin/sh
cd "$(dirname "$0")" && g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -I shim -include shim/Arduino.h test_firmware.cpp -o /tmp/nk_fw_test && /tmp/nk_fw_test
