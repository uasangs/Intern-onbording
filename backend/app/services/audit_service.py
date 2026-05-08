# ── audit_service.py ────────────────────────────────────────────────────────
from sqlalchemy.orm import Session
from app.models.models import AuditLog


def log_action(
    db: Session,
    intern_record_id: str,
    performed_by: str,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    field_changed: str = None,
    old_value: str = None,
    new_value: str = None,
):
    entry = AuditLog(
        intern_record_id=intern_record_id,
        performed_by=performed_by,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        field_changed=field_changed,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(entry)
    db.commit()
