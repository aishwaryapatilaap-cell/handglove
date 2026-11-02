"""Admin helper.  python manage.py pending   |   python manage.py approve therapist@email.com"""
import sys
from database import SessionLocal, Base, engine
import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()
cmd = sys.argv[1] if len(sys.argv) > 1 else ""
if cmd == "pending":
    for u in db.query(models.User).filter(models.User.role == models.Role.therapist, models.User.is_approved == False):  # noqa: E712
        print(u.email, "-", u.full_name)
elif cmd == "approve" and len(sys.argv) > 2:
    u = db.query(models.User).filter(models.User.email == sys.argv[2].lower()).first()
    if not u or u.role != models.Role.therapist:
        sys.exit("No therapist with that email")
    u.is_approved = True
    db.commit()
    print("Approved:", u.email, "| link code:", u.link_code)
else:
    print(__doc__)
