from fastapi import FastAPI
from database import engine, Base
from routers import auth, users, sessions, messages

Base.metadata.create_all(bind=engine)

# The Vite dev server proxies /api to this app, so browser calls are same-origin (no CORS needed).
app = FastAPI(title="NeuroKinetics API", version="2.0.0")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"]) 
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
