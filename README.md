# NeuroKinetics — Smart Hand Rehabilitation Platform

React + TypeScript frontend, FastAPI + SQLite backend, and ESP32 glove connection over USB serial.

## What is included in this update

- Therapist workspace with a patient-care overview, searchable linked-patient cards, attention flags and a direct Open patient record action.
- Patient records show age, gender, condition, affected hand, medical history, medications, allergies, emergency contact, clinical notes, session history and live glove status. Therapists can edit the patient profile.
- Therapists can select exercises from a starter library or add custom exercises, configure sets/reps/frequency/instructions, and publish the plan. Patients see the published daily plan on their Today dashboard.
- Patient profile fields for age, gender (optional), condition, affected hand, medical history, medications, allergies and emergency contact.
- Patient dashboard with prescribed plan, weekly activity, session history and therapist messages.
- Exercise workspace with five finger cards, live angle/sensor status, repetition counter and session saving.
- Progress page with session score trend, repetitions, duration and history.
- USB Web Serial now accepts both dashboard JSON and the user's existing human-readable Serial Monitor demo output.
- ESP32 firmware reads all five potentiometers and streams dashboard-compatible JSON at 115200 baud.
- Patient exercise page publishes the five live angles to the backend once per second; the therapist patient record displays those values.

## Hardware and safety notes

The updated firmware reads five ADC inputs using the user's demo pin map: index GPIO34, middle GPIO35, ring GPIO32, little GPIO33 and thumb GPIO36. It converts each ADC value using the example range 500–3500 to 0–90 degrees and streams the array in this order: `[thumb, index, middle, ring, little]`. These are example calibration endpoints: check the actual raw values at each finger's open and closed positions and adjust `ADC_MIN` / `ADC_MAX` before relying on the displayed angles. The same endpoint is currently applied to all five fingers; calibrate individually in firmware if the potentiometers have different mechanical ranges.

The repetition counter uses a prototype index-finger threshold (crossing from below 25° to at least 45°), not a validated clinical metric. The motor is an actuator, not a certified medical device. Bench-test with the glove off the hand, keep the hand clear, and do not use powered movement on a patient without qualified therapist supervision, suitable mechanical force/torque limits, an emergency stop and safeguards.

## 1. Run on macOS

Install Python 3.11+ and Node.js 20+ (LTS). Unzip the project. Open Terminal and change into the project folder:

```bash
cd ~/Downloads/NeuroKinetics-updated
```

If you extracted it under a different folder, use that folder's actual path.

### Backend — Terminal window 1

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the generated value into `backend/.env` after `SECRET_KEY=` and save the file. Then start the API:

```bash
uvicorn main:app --reload --port 8000
```

Check `http://localhost:8000/api/health` — it should return `{"status":"ok"}`.

**Database note:** this version adds profile, exercise-plan and messaging columns/tables. SQLAlchemy `create_all()` creates new tables but does not migrate existing SQLite columns. If you are upgrading an old local demo database, stop the backend and back it up first, then remove only the local development database `backend/neurokinetics.db` so it can be recreated. This deletes local demo accounts and sessions. Do not do this to real patient data. For production, use Alembic migrations and a managed database with backups.

### Frontend — Terminal window 2

Open a second Terminal window:

```bash
cd ~/Downloads/NeuroKinetics-updated
npm ci
npm run build
npm run dev
```

Open `http://localhost:5173` in **Google Chrome or Microsoft Edge**.

Safari does not currently provide the Web Serial API required by the USB glove connection. The screenshots show Safari, so switch to Chrome/Edge for real hardware. The normal website can still be viewed in Safari, but the USB connection button needs a supported browser.

## 2. Connect the ESP32 glove

1. Open Arduino IDE.
2. Open `firmware/neurokinetics_glove/neurokinetics_glove.ino`.
3. Install/select the ESP32 Arduino board package if needed.
4. Select **ESP32 Dev Module** and the correct USB port.
5. Upload the sketch.
6. Close Arduino IDE Serial Monitor/Plotter. Only one application can own the serial port.
7. In Chrome/Edge open `http://localhost:5173`, sign in as a patient and open **Glove** or **Exercises**.
8. Click **Connect glove (USB)** / **Connect USB glove**, choose the ESP32 serial port and allow access.
9. Confirm all five angles change when you move each finger manually. The firmware currently uses the example ADC range 500–3500 for all five sensors; edit `ADC_MIN` / `ADC_MAX` to match your measured hardware endpoints.
10. To populate the therapist dashboard, keep the patient signed in, open **Exercises**, connect the glove on that page and keep the page open. The patient exercise page sends live readings to the backend every second while connected. The therapist can then open that patient's record to see live readings. Test the motor only with the hand clear and use STOP if anything behaves unexpectedly.

The browser sends newline-terminated text commands at 115200 baud (`PING`, `OPEN`, `CLOSE`, `STOP`, `GOTO:45`). The firmware streams JSON readings every 100 ms. The website parses that stream directly; no separate serial-to-server bridge is needed because the browser Web Serial API connects to the USB device.

### Current pin assumptions in the firmware

- Index potentiometer: GPIO 34
- Middle potentiometer: GPIO 35
- Ring potentiometer: GPIO 32
- Little potentiometer: GPIO 33
- Thumb potentiometer: GPIO 36
- Motor driver direction pins: GPIO 2 and GPIO 4
- Motor driver PWM: GPIO 5
- If your motor driver has a STBY/EN pin, wire it according to that driver's datasheet.
- ESP32, driver and battery grounds must be common.

Verify your actual wiring and motor supply before powering it. Do not power the motor from the ESP32 3.3 V pin.

## 3. Create therapist and patient accounts

- Register a patient account normally.
- Register a therapist account. Therapist accounts require approval.
- From the backend folder (with `.venv` active), list and approve the therapist:

```bash
cd backend
source .venv/bin/activate
python manage.py pending
python manage.py approve therapist@example.com
```

- Sign in as the therapist and copy the six-character link code from the Patient care dashboard.
- Sign in as the patient, open Today and enter the code.
- Return to the therapist account and open Patients. Each linked patient now has an **Open patient record** button.
- In the patient record, use **Edit medical profile** to review/update age, gender, condition, affected hand, history, medication, allergies, emergency contact and clinical notes.
- Under **Daily exercise prescription**, add exercises from the library or create a custom exercise. Set sets/day, reps/set, frequency and patient instructions, then click **Save and publish daily plan**.
- The patient sees the saved plan on their Today page. The therapist can also review live glove readings, exercise history and message the patient from the same record.

## 4. Tests

```bash
# Backend
cd backend
source .venv/bin/activate
pip install -r requirements-dev.txt
python -m pytest

# Firmware logic tests (from project root)
cd firmware
sh test/run_tests.sh
```

The browser-side fake serial test, if desired:

```bash
npx tsx tools/glove_test.ts
```

## 5. Current prototype boundaries

- Missed-session status is surfaced as an attention flag on the therapist's patient list; this version does not send push/email/SMS notifications.
- Messaging is in-app and refreshes every five seconds; it is not end-to-end encrypted or a real-time WebSocket service.
- Progress analytics summarize saved sessions. They should not be presented as clinical diagnosis or proof of recovery.
- The therapist exercise list is a starter library. Exercise selection, repetitions and range must be prescribed by a qualified clinician for each patient's condition.
- Health data is sensitive. This local demo is not production-ready for real patient records. Before deployment, add formal database migrations, stronger access/audit controls, HTTPS, encrypted backups, retention policy, notification consent and applicable Indian health-data/privacy compliance.

## Exercise repetition and progress tracking

The patient exercise page counts one index-finger repetition after a complete cycle: extend to **25 degrees or below**, then flex to **45 degrees or above**. If the index finger is already above 25 degrees when the session starts, first extend it below 25 degrees; then bend it above 45 degrees to register the first repetition. Each cycle counts once.

The exercise page displays elapsed time in seconds (and minutes/seconds for longer sessions). Finishing a session saves its duration, repetition count, and score (`reps_completed / reps_target`, capped at 100%). Progress Analysis displays short sessions in seconds instead of rounding them down to `0 min`.

Previously saved sessions are not recalculated: their recorded zero reps and zero scores remain as historical data. New completed sessions will use the updated tracking logic.
