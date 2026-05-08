# """
# Seed script — run once to create initial users and sample data.

# Usage:
#     cd backend
#     python seed.py
# """
# import sys
# import os
# sys.path.insert(0, os.path.dirname(__file__))

# from app.core.database import SessionLocal, engine
# from app.core.security import hash_password
# from app.models.models import Base, HRUser, UserRole, InternRecord, InternStatus
# from datetime import date
# import uuid

# def seed():
#     # Create all tables
#     Base.metadata.create_all(bind=engine)
#     db = SessionLocal()

#     try:
#         # ── Check if already seeded ──────────────────────────
#         existing = db.query(HRUser).count()
#         if existing > 0:
#             print(f"✓ Database already has {existing} users. Skipping seed.")
#             print("\nExisting users:")
#             for u in db.query(HRUser).all():
#                 print(f"  {u.role:10} | {u.email:40} | {u.name}")
#             return

#         print("Seeding database...")

#         # ── Create users ─────────────────────────────────────
#         users = [
#             HRUser(
#                 name="Sheba Banerjee",
#                 email="sheba.banerjee@grasim.com",
#                 password_hash=hash_password("admin@123"),
#                 role=UserRole.hr,
#                 department="Human Resources",
#                 location="MBDD",
#             ),
#             HRUser(
#                 name="HR Admin",
#                 email="hr@grasim.com",
#                 password_hash=hash_password("admin@123"),
#                 role=UserRole.hr,
#                 department="Human Resources",
#                 location="TRADC",
#             ),
#             HRUser(
#                 name="Accounts Team",
#                 email="accounts@grasim.com",
#                 password_hash=hash_password("accounts@123"),
#                 role=UserRole.accounts,
#                 department="Finance",
#                 location="MBDD",
#             ),
#             HRUser(
#                 name="IT Support",
#                 email="it@grasim.com",
#                 password_hash=hash_password("it@123"),
#                 role=UserRole.it,
#                 department="IT",
#                 location="MBDD",
#             ),
#             HRUser(
#                 name="Gaurav Shrivastava",
#                 email="gaurav.shrivastava@grasim.com",
#                 password_hash=hash_password("manager@123"),
#                 role=UserRole.manager,
#                 department="TRADC",
#                 location="TRADC",
#             ),
#             HRUser(
#                 name="Rajesh Bhandari",
#                 email="rajesh.bhandari@grasim.com",
#                 password_hash=hash_password("manager@123"),
#                 role=UserRole.manager,
#                 department="MBDD",
#                 location="MBDD",
#             ),
#         ]

#         for u in users:
#             db.add(u)
#         db.flush()  # get IDs

#         print(f"✓ Created {len(users)} users")

#         # ── Print login credentials ───────────────────────────
#         print("\n" + "="*60)
#         print("LOGIN CREDENTIALS")
#         print("="*60)
#         creds = [
#             ("HR (Sheba Banerjee)", "sheba.banerjee@grasim.com", "admin@123"),
#             ("HR Admin",            "hr@grasim.com",              "admin@123"),
#             ("Accounts",           "accounts@grasim.com",        "accounts@123"),
#             ("IT Team",            "it@grasim.com",              "it@123"),
#             ("Manager (Gaurav)",   "gaurav.shrivastava@grasim.com", "manager@123"),
#             ("Manager (Rajesh)",   "rajesh.bhandari@grasim.com",    "manager@123"),
#         ]
#         for role, email, pwd in creds:
#             print(f"  {role:25} | {email:40} | {pwd}")
#         print("="*60)

#         db.commit()
#         print("\n✓ Seed complete! Start the server and visit http://localhost:5173")

#     except Exception as e:
#         db.rollback()
#         print(f"✗ Seed failed: {e}")
#         raise
#     finally:
#         db.close()


# if __name__ == "__main__":
#     seed()



"""
Seed script - plain text passwords, no encryption.
Run: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine
from app.models.models import Base, HRUser, UserRole


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing = db.query(HRUser).count()
        if existing > 0:
            print(f"Already seeded ({existing} users). Skipping.")
            print_creds()
            return

        print("Seeding database...")

        users = [
            HRUser(name="Sheba Banerjee",       email="sheba@grasim.com",   password_hash="hr123",       role=UserRole.hr,       department="HR",      location="MBDD"),
            HRUser(name="HR Admin",              email="hr@grasim.com",      password_hash="hr123",       role=UserRole.hr,       department="HR",      location="TRADC"),
            HRUser(name="Accounts Team",         email="accounts@grasim.com",password_hash="accounts123", role=UserRole.accounts, department="Finance", location="MBDD"),
            HRUser(name="IT Support",            email="it@grasim.com",      password_hash="it123",       role=UserRole.it,       department="IT",      location="MBDD"),
            HRUser(name="Gaurav Shrivastava",    email="gaurav@grasim.com",  password_hash="manager123",  role=UserRole.manager,  department="TRADC",   location="TRADC"),
            HRUser(name="Rajesh Bhandari",       email="rajesh@grasim.com",  password_hash="manager123",  role=UserRole.manager,  department="MBDD",    location="MBDD"),
        ]

        for u in users:
            db.add(u)
        db.commit()
        print(f"Created {len(users)} users.")
        print_creds()

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


def print_creds():
    print("\n" + "="*55)
    print("LOGIN CREDENTIALS (plain text passwords)")
    print("="*55)
    print(f"  HR          | sheba@grasim.com     | hr123")
    print(f"  HR Admin    | hr@grasim.com        | hr123")
    print(f"  Accounts    | accounts@grasim.com  | accounts123")
    print(f"  IT Team     | it@grasim.com        | it123")
    print(f"  Manager 1   | gaurav@grasim.com    | manager123")
    print(f"  Manager 2   | rajesh@grasim.com    | manager123")
    print("="*55)
    print("\nTo change password: UPDATE hr_users SET password_hash='newpassword' WHERE email='user@grasim.com';")


if __name__ == "__main__":
    seed()