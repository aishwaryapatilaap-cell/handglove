# NeuroKinetics Backend 🧤⚡

FastAPI backend for the NeuroKinetics smart hand rehabilitation platform.

## Features
- **JWT Auth** — register/login for patients and therapists
- **Role-based access** — patients see their own data; therapists see all their patients
- **XP & levelling** — auto-calculated on every session log
- **Streak tracking** — consecutive daily session streaks
- **Therapist notes** — clinicians can annotate any session

---

## Local Setup

### 1. Create a virtual environment
```bash
cd neurokinetics-backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the server
```bash
uvicorn main:app --reload
```

Server runs at **http://localhost:8000**
Interactive API docs at **http://localhost:8000/docs**

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register patient or therapist |
| POST | `/api/auth/login` | Login → get JWT token |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me` | Your profile |
| GET | `/api/users/patients` | Therapist: your assigned patients |
| GET | `/api/users/all-patients` | Therapist: all patients |
| POST | `/api/users/assign-therapist` | Assign therapist to patient |
| GET | `/api/users/{id}` | Get any user profile |

### Sessions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions/` | Log a completed session (auto-awards XP) |
| GET | `/api/sessions/my` | Your own session history |
| GET | `/api/sessions/patient/{id}` | A patient's sessions |
| PATCH | `/api/sessions/{id}/note` | Therapist: add clinical note |
| GET | `/api/sessions/stats/{id}` | Summary stats for a patient |

---

## XP Formula
```
XP = (level × 50) + (score% × 1) + min(60, duration_seconds ÷ 10)
```
Every 500 XP = 1 level (max level 10).

---

## Deployment (Free — Render.com)

1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `SECRET_KEY` = some long random string
6. Deploy! You get a free URL like `https://neurokinetics-api.onrender.com`

Then update `main.py` → `allow_origins` with your Vercel frontend URL.

---

## Frontend Deployment (Vercel)

In your `NeuroKinetics-main` folder:

```bash
npm install -g vercel
vercel
```

Follow the prompts — it auto-detects Vite and deploys in ~1 minute.
Free URL: `https://neurokinetics.vercel.app`

---

## Connecting Frontend to Backend

In your React code, make API calls like:

```typescript
// Login example
const res = await fetch("https://your-api.onrender.com/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { access_token } = await res.json();
localStorage.setItem("token", access_token);

// Authenticated request
const profile = await fetch("https://your-api.onrender.com/api/users/me", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
```

---

## Production Checklist
- [ ] Change `SECRET_KEY` in `auth_utils.py` to a long random string
- [ ] Switch SQLite → PostgreSQL (update `SQLALCHEMY_DATABASE_URL`)
- [ ] Set `allow_origins` to your actual frontend URL only
- [ ] Use environment variables for secrets (never commit them)
