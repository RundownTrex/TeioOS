import os
import sys
from pathlib import Path

# Add parent directory (server/backend) to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings


def seed_admin():
    admin_password = os.getenv("ADMIN_PASSWORD")
    if not admin_password:
        if settings.app_env.lower() != "development":
            print(
                "[ERROR] ADMIN_PASSWORD environment variable must be explicitly set in non-development environments.",
                file=sys.stderr,
            )
            sys.exit(1)
        admin_password = "admin123"

    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            if existing_admin.email.endswith(".local"):
                new_email = os.getenv("ADMIN_EMAIL", "admin@teioos.org")
                existing_admin.email = new_email
                db.commit()
                print(f"[INFO] Updated admin user email from .local to '{new_email}'.")
            else:
                print("[INFO] Admin user 'admin' already exists in the database.")
            return

        admin_user = User(
            username="admin",
            email=os.getenv("ADMIN_EMAIL", "admin@teioos.org"),
            name="System Administrator",
            role=UserRole.ADMIN,
            password_hash=get_password_hash(admin_password),
            is_active=True,
        )

        db.add(admin_user)
        db.commit()
        print("[SUCCESS] Created initial admin user:")
        print(f"         Username: admin")
        print(f"         Password: {admin_password}")
        print(f"         Email:    {admin_user.email}")
        print(f"         Role:     admin")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed admin user: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
