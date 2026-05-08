from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_accounts, require_it, require_manager, get_current_user
from app.models.models import (
    HRUser, InternRecord, AccountsTask, StipendPayment,
    ITTask, ManagerReview, InternStatus, TaskStatus
)
from app.schemas.schemas import (
    AccountsTaskOut, AccountsTaskUpdate,
    StipendPaymentIn, StipendPaymentOut,
    ITTaskOut, ITTaskUpdate,
    ManagerReviewIn, ManagerReviewOut,
    InternListItem,
)

# ═══════════════════════════════════════════════════════════
# ACCOUNTS ROUTES
# ═══════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════
# ACCOUNTS ROUTES
# ═══════════════════════════════════════════════════════════

accounts_router = APIRouter(prefix="/accounts", tags=["Accounts"])


def _build_accounts_task(task) -> dict:
    """Build full accounts task response with intern + candidate + bank details."""
    record = task.intern_record
    candidate = record.candidate if record else None
    bank = candidate.bank_details if candidate else None

    intern_info = {
        "id": record.id,
        "candidate_email": record.candidate_email,
        "role_title": record.role_title,
        "department": record.department,
        "location": record.location,
        "start_date": record.start_date,
        "end_date": record.end_date,
        "duration_weeks": record.duration_weeks,
        "stipend_amount": record.stipend_amount,  # ← actual amount from HR
        "payment_frequency": record.payment_frequency or "monthly",
        "notes_for_accounts": record.notes_for_accounts,
        "candidate_name": candidate.full_name if candidate else None,
        "institute_name": candidate.institute_name if candidate else None,
        "bank_name": bank.bank_name if bank else None,
        "account_number": bank.account_number if bank else None,
        "ifsc_code": bank.ifsc_code if bank else None,
        "account_holder_name": bank.account_holder_name if bank else None,
        "account_type": bank.account_type if bank else None,
    } if record else None

    return {
        "id": task.id,
        "intern_record_id": task.intern_record_id,
        "vendor_id": task.vendor_id,
        "payment_mode": task.payment_mode,
        "task_status": task.task_status,
        "notes": task.notes,
        "created_at": task.created_at,
        "completed_at": task.completed_at,
        "updated_at": task.updated_at,
        "intern": intern_info,
    }


@accounts_router.get("/tasks")
def get_accounts_tasks(
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_accounts),
):
    tasks = db.query(AccountsTask).order_by(AccountsTask.created_at.desc()).all()
    return [_build_accounts_task(t) for t in tasks]


@accounts_router.get("/intern/{intern_id}")
def get_accounts_task_detail(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_accounts),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record or not record.accounts_task:
        raise HTTPException(status_code=404, detail="Not found")
    return _build_accounts_task(record.accounts_task)


@accounts_router.get("/task/{task_id}")
def get_accounts_task_by_id(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_accounts),
):
    task = db.query(AccountsTask).filter(AccountsTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _build_accounts_task(task)


@accounts_router.patch("/task/{task_id}", response_model=AccountsTaskOut)
def update_accounts_task(
    task_id: UUID,
    payload: AccountsTaskUpdate,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_accounts),
):
    task = db.query(AccountsTask).filter(AccountsTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.vendor_id is not None:
        task.vendor_id = payload.vendor_id
    if payload.payment_mode is not None:
        task.payment_mode = payload.payment_mode
    if payload.task_status is not None:
        task.task_status = payload.task_status
        if payload.task_status == TaskStatus.completed:
            task.completed_at = datetime.utcnow()
    if payload.notes is not None:
        task.notes = payload.notes

    db.commit()
    db.refresh(task)
    return task


@accounts_router.post("/task/{task_id}/stipend", response_model=StipendPaymentOut)
def add_stipend_payment(
    task_id: UUID,
    payload: StipendPaymentIn,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_accounts),
):
    task = db.query(AccountsTask).filter(AccountsTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    payment = StipendPayment(
        accounts_task_id=task.id,
        intern_record_id=task.intern_record_id,
        payment_date=payload.payment_date,
        amount=payload.amount,
        month_year=payload.month_year,
        status=payload.status,
        utr_reference=payload.utr_reference,
        notes=payload.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@accounts_router.get("/task/{task_id}/stipends", response_model=List[StipendPaymentOut])
def get_stipend_payments(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_accounts),
):
    task = db.query(AccountsTask).filter(AccountsTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.stipend_payments


# ═══════════════════════════════════════════════════════════
# IT ROUTES
# ═══════════════════════════════════════════════════════════

it_router = APIRouter(prefix="/it", tags=["IT"])


def _build_it_task(task) -> dict:
    """Build full IT task response with intern + candidate details."""
    record = task.intern_record
    candidate = record.candidate if record else None

    intern_info = {
        "id": record.id,
        "candidate_email": record.candidate_email,
        "role_title": record.role_title,
        "department": record.department,
        "location": record.location,
        "start_date": record.start_date,
        "end_date": record.end_date,
        "duration_weeks": record.duration_weeks,
        "candidate_name": candidate.full_name if candidate else None,
        "candidate_mobile": candidate.mobile if candidate else None,
        "institute_name": candidate.institute_name if candidate else None,
        "course": candidate.course if candidate else None,
        "graduation_year": candidate.graduation_year if candidate else None,
    } if record else None

    return {
        "id": task.id,
        "intern_record_id": task.intern_record_id,
        "laptop_required": task.laptop_required,
        "laptop_serial": task.laptop_serial,
        "laptop_provisioned": task.laptop_provisioned,
        "email_required": task.email_required,
        "abg_email_id": task.abg_email_id,
        "email_provisioned": task.email_provisioned,
        "other_assets": task.other_assets,
        "other_assets_provisioned": task.other_assets_provisioned,
        "task_status": task.task_status,
        "notes": task.notes,
        "created_at": task.created_at,
        "completed_at": task.completed_at,
        "intern": intern_info,
    }


@it_router.get("/tasks")
def get_it_tasks(
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_it),
):
    tasks = db.query(ITTask).order_by(ITTask.created_at.desc()).all()
    return [_build_it_task(t) for t in tasks]


@it_router.get("/task/{task_id}")
def get_it_task_by_id(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_it),
):
    task = db.query(ITTask).filter(ITTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _build_it_task(task)


@it_router.get("/intern/{intern_id}")
def get_it_task_detail(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_it),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record or not record.it_task:
        raise HTTPException(status_code=404, detail="Not found")
    return _build_it_task(record.it_task)


@it_router.patch("/task/{task_id}")
def update_it_task(
    task_id: UUID,
    payload: ITTaskUpdate,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_it),
):
    task = db.query(ITTask).filter(ITTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.laptop_serial is not None:
        task.laptop_serial = payload.laptop_serial
    if payload.laptop_provisioned is not None:
        # Cannot mark provisioned without serial number
        if payload.laptop_provisioned and not task.laptop_serial and not payload.laptop_serial:
            raise HTTPException(
                status_code=400,
                detail="Please enter laptop serial number before marking as provisioned"
            )
        task.laptop_provisioned = payload.laptop_provisioned
    if payload.abg_email_id is not None:
        task.abg_email_id = payload.abg_email_id
        from app.models.models import ABGEmailAccess
        existing = task.intern_record.abg_email_access
        if not existing:
            access = ABGEmailAccess(
                intern_record_id=task.intern_record_id,
                abg_email_id=payload.abg_email_id,
            )
            db.add(access)
        else:
            existing.abg_email_id = payload.abg_email_id
    if payload.email_provisioned is not None:
        # Cannot mark provisioned without email ID
        if payload.email_provisioned and not task.abg_email_id and not payload.abg_email_id:
            raise HTTPException(
                status_code=400,
                detail="Please enter ABG email ID before marking as provisioned"
            )
        task.email_provisioned = payload.email_provisioned
    if payload.other_assets_provisioned is not None:
        task.other_assets_provisioned = payload.other_assets_provisioned
    if payload.task_status is not None:
        task.task_status = payload.task_status
        if payload.task_status == TaskStatus.completed:
            task.completed_at = datetime.utcnow()
    if payload.notes is not None:
        task.notes = payload.notes

    # Auto-complete if all required items provisioned
    laptop_ok = not task.laptop_required or task.laptop_provisioned
    email_ok = not task.email_required or task.email_provisioned
    other_ok = not task.other_assets or task.other_assets_provisioned
    if laptop_ok and email_ok and other_ok:
        task.task_status = TaskStatus.completed
        task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return _build_it_task(task)


# ═══════════════════════════════════════════════════════════
# MANAGER ROUTES
# ═══════════════════════════════════════════════════════════

manager_router = APIRouter(prefix="/manager", tags=["Manager"])


def _build_manager_intern(record) -> dict:
    """Build full intern info for manager view."""
    candidate = record.candidate
    review = record.manager_review
    return {
        "id": record.id,
        "serial_no": record.serial_no,
        "candidate_email": record.candidate_email,
        "role_title": record.role_title,
        "department": record.department,
        "location": record.location,
        "start_date": record.start_date,
        "end_date": record.end_date,
        "duration_weeks": record.duration_weeks,
        "stipend_amount": record.stipend_amount,
        "status": record.status,
        "experience_certificate_issued": record.experience_certificate_issued,
        "project_submission_done": record.project_submission_done,
        "project_presentation_done": record.project_presentation_done,
        "eval_from_mgr_done": record.eval_from_mgr_done,
        "panel_evaluation_done": record.panel_evaluation_done,
        # Candidate details
        "candidate_name": candidate.full_name if candidate else None,
        "candidate_mobile": candidate.mobile if candidate else None,
        "institute_name": candidate.institute_name if candidate else None,
        "course": candidate.course if candidate else None,
        "graduation_year": candidate.graduation_year if candidate else None,
        "qualification": candidate.qualification if candidate else None,
        # Review status
        "review_submitted": review is not None and review.submitted_at is not None,
        "review_id": str(review.id) if review else None,
    }


@manager_router.get("/interns")
def get_my_interns(
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_manager),
):
    records = db.query(InternRecord).filter(
        InternRecord.reporting_manager_id == current_user.id
    ).order_by(InternRecord.created_at.desc()).all()
    return [_build_manager_intern(r) for r in records]


@manager_router.get("/intern/{intern_id}")
def get_intern_detail_for_manager(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_manager),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Intern not found")
    if record.reporting_manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _build_manager_intern(record)


@manager_router.post("/intern/{intern_id}/review", response_model=ManagerReviewOut)
def submit_review(
    intern_id: UUID,
    payload: ManagerReviewIn,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_manager),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Intern not found")

    if record.reporting_manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the manager of this intern")

    review = record.manager_review
    if not review:
        review = ManagerReview(
            intern_record_id=record.id,
            manager_id=current_user.id,
        )
        db.add(review)

    review.project_name = payload.project_name
    review.guide_names = payload.guide_names
    review.performance_rating = payload.performance_rating
    review.attitude_rating = payload.attitude_rating
    review.punctuality_rating = payload.punctuality_rating
    review.technical_rating = payload.technical_rating
    review.communication_rating = payload.communication_rating
    review.overall_rating = payload.overall_rating
    review.feedback_text = payload.feedback_text
    review.recommendation = payload.recommendation
    review.eval_from_mgr = payload.eval_from_mgr
    review.panel_evaluation = payload.panel_evaluation
    review.project_submission = payload.project_submission
    review.project_presentation = payload.project_presentation
    review.submitted_at = datetime.utcnow()

    # Update tracker flags on intern record
    record.eval_from_mgr_done = payload.eval_from_mgr
    record.panel_evaluation_done = payload.panel_evaluation
    record.project_submission_done = payload.project_submission
    record.project_presentation_done = payload.project_presentation
    record.status = InternStatus.review_pending

    db.commit()
    db.refresh(review)
    return review


@manager_router.get("/intern/{intern_id}/review")
def get_review(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_manager),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Intern not found")
    if record.reporting_manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    # Return null if no review yet — don't throw 404
    if not record.manager_review:
        return None
    return record.manager_review