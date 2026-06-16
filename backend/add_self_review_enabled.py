"""
Run this once to add self_review_enabled column to intern_records table.
Usage: cd backend && python add_self_review_enabled.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE intern_records ADD COLUMN self_review_enabled BOOLEAN DEFAULT FALSE"))
        conn.commit()
        print("✓ Column 'self_review_enabled' added to intern_records")
    except Exception as e:
        if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
            print("✓ Column already exists — skipping")
        else:
            print(f"✗ Error: {e}")
            raise