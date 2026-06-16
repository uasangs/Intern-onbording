from sqlalchemy.orm import Session
from app.models.models import AuditLog
import logging

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    intern_record_id: str,
    performed_by: str,          # UUID string for HR/manager users, None for candidate actions
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    field_changed: str = None,
    old_value: str = None,
    new_value: str = None,
    actor_label: str = None,    # Human-readable label e.g. "Candidate", "System"
):
    try:
        # performed_by must be a valid UUID or None — never a plain string like "candidate"
        valid_performed_by = None
        if performed_by and performed_by not in ("candidate", "system", "auto"):
            valid_performed_by = performed_by
        
        # Store actor info in field_changed if no UUID available
        notes = actor_label or (performed_by if performed_by in ("candidate", "system") else None)

        entry = AuditLog(
            intern_record_id=intern_record_id,
            performed_by=valid_performed_by,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            field_changed=field_changed,
            old_value=old_value,
            new_value=f"[{notes}] {new_value}" if notes and new_value else (new_value or (f"[{notes}]" if notes else None)),
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        # Never let audit logging break the main operation
        logger.error(f"Audit log failed for action {action}: {e}")
        try:
            db.rollback()
        except Exception:
            pass