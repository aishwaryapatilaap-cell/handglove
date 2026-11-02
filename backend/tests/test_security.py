from conftest import register, login, approve
from fastapi.testclient import TestClient
from main import app

SESSION = {"level": 1, "exercise_name": "Open and close fist", "duration_secs": 120, "score_pct": 80, "pain_before": 2, "pain_after": 3}


def test_register_rules(client):
    assert register(client, "a@x.com", pw="short1").status_code == 422          # too short
    assert register(client, "a@x.com", pw="allletters").status_code == 422      # no number
    assert register(client, "a@x.com", consent=False).status_code == 422        # no consent
    assert register(client, "a@x.com").status_code == 201
    assert register(client, "a@x.com").status_code == 400                       # duplicate


def test_login_cookie_and_me(client):
    register(client, "a@x.com")
    r = login(client, "a@x.com")
    assert r.status_code == 200 and "httponly" in r.headers["set-cookie"].lower()
    assert "access_token" not in r.text                                         # token never in body
    assert client.get("/api/auth/me").json()["email"] == "a@x.com"
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401


def test_same_error_for_wrong_password_and_unknown_email(client):
    register(client, "a@x.com")
    a = login(client, "a@x.com", "Wrong1234")
    b = login(client, "nobody@x.com")
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_lockout_after_five_failures(client):
    register(client, "a@x.com")
    for _ in range(5):
        login(client, "a@x.com", "Wrong1234")
    assert login(client, "a@x.com").status_code == 429                          # even the right password


def test_therapist_needs_approval(client):
    register(client, "t@x.com", role="therapist")
    assert login(client, "t@x.com").status_code == 403
    approve("t@x.com")
    assert login(client, "t@x.com").status_code == 200


def test_therapist_sees_only_linked_patients(client):
    register(client, "t@x.com", role="therapist"); code = approve("t@x.com")
    p1, p2 = TestClient(app), TestClient(app)
    for c, e in ((p1, "p1@x.com"), (p2, "p2@x.com")):
        register(c, e); login(c, e)
        assert c.post("/api/sessions/", json=SESSION).status_code == 201
    assert p1.post("/api/users/me/link-therapist", json={"code": code.lower()}).status_code == 200
    login(client, "t@x.com")
    listed = client.get("/api/users/patients").json()
    assert [p["email"] for p in listed] == ["p1@x.com"]
    p1_id, p2_id = listed[0]["id"], p1.get("/api/auth/me").json()["id"]
    assert client.get(f"/api/sessions/patient/{p1_id}").status_code == 200
    other = p2.get("/api/auth/me").json()["id"]
    assert client.get(f"/api/sessions/patient/{other}").status_code == 404      # unlinked patient hidden
    assert client.get(f"/api/users/{other}").status_code == 404


def test_patient_cannot_read_another_patient(client):
    a, b = TestClient(app), TestClient(app)
    register(a, "a@x.com"); login(a, "a@x.com"); register(b, "b@x.com"); login(b, "b@x.com")
    bid = b.get("/api/auth/me").json()["id"]
    assert a.get(f"/api/sessions/patient/{bid}").status_code == 403
    assert a.get(f"/api/sessions/stats/{bid}").status_code == 403


def test_therapist_cannot_log_sessions_and_session_validation(client):
    register(client, "t@x.com", role="therapist"); approve("t@x.com"); login(client, "t@x.com")
    assert client.post("/api/sessions/", json=SESSION).status_code == 403
    p = TestClient(app); register(p, "p@x.com"); login(p, "p@x.com")
    assert p.post("/api/sessions/", json={**SESSION, "pain_after": 11}).status_code == 422
    assert p.post("/api/sessions/", json={**SESSION, "score_pct": 150}).status_code == 422


def test_delete_account_needs_password(client):
    register(client, "a@x.com"); login(client, "a@x.com")
    assert client.request("DELETE", "/api/users/me", json={"password": "Wrong1234"}).status_code == 400
    assert client.request("DELETE", "/api/users/me", json={"password": "Strong123"}).status_code == 200
    assert login(client, "a@x.com").status_code == 401
