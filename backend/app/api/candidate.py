from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_portal_token
from app.models.models import (
    InternRecord, Candidate, BankDetails, Document,
    AnnexureSignature, InternStatus, DocType, AnnexureType
)
from app.schemas.schemas import (
    CandidatePortalSubmit, CandidateOut, BankDetailsOut,
    DocumentOut, AnnexureSignIn, AnnexureSignOut,
    OfferResponseRequest, PortalInfo, OfferLetterOut, SelfReviewIn
)
from app.services.file_service import read_upload
from app.services.audit_service import log_action

router = APIRouter(prefix="/candidate", tags=["Candidate Portal"])


def get_intern_from_token(token: str, db: Session, track_access: bool = False) -> InternRecord:
    intern_id = decode_portal_token(token)
    if not intern_id:
        raise HTTPException(status_code=401, detail="Invalid or expired portal link")
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.portal_token_revoked:
        raise HTTPException(
            status_code=401,
            detail="This portal link has been revoked by HR. Please contact HR for a new link."
        )
    if track_access:
        record.portal_token_last_accessed = datetime.utcnow()
        record.portal_token_access_count = (record.portal_token_access_count or 0) + 1
        db.commit()
    return record


def _build_portal_info(record, annexures_signed):
    """Build PortalInfo dict with all candidate data and control flags."""
    candidate = record.candidate
    bank = candidate.bank_details if candidate else None

    hr_prefilled = []
    if candidate:
        if candidate.full_name: hr_prefilled.append('full_name')
        if candidate.gender: hr_prefilled.append('gender')
        if candidate.mobile: hr_prefilled.append('mobile')
        if candidate.city: hr_prefilled.append('city')
        if candidate.state: hr_prefilled.append('state')
        if candidate.institute_name: hr_prefilled.append('institute_name')
        if candidate.qualification: hr_prefilled.append('qualification')
        if candidate.course: hr_prefilled.append('course')
        if candidate.year_of_study: hr_prefilled.append('year_of_study')
        if candidate.graduation_year: hr_prefilled.append('graduation_year')

    return PortalInfo(
        intern_record_id=record.id,
        candidate_email=record.candidate_email,
        role_title=record.role_title,
        department=record.department,
        location=record.location,
        start_date=record.start_date,
        end_date=record.end_date,
        stipend_amount=record.stipend_amount,
        status=record.status,
        portal_submitted=record.portal_submitted_at is not None,
        offer_status=record.offer_letter.status if record.offer_letter and record.offer_letter.status != 'draft' else None,
        annexures_signed=annexures_signed,
        candidate_name=candidate.full_name if candidate else None,
        gender=candidate.gender if candidate else None,
        dob=str(candidate.dob) if candidate and candidate.dob else None,
        mobile=candidate.mobile if candidate else None,
        contact_no=candidate.contact_no if candidate else None,
        address=candidate.address if candidate else None,
        city=candidate.city if candidate else None,
        state=candidate.state if candidate else None,
        pincode=candidate.pincode if candidate else None,
        pan_card_no=candidate.pan_card_no if candidate else None,
        aadhaar_no=candidate.aadhaar_no if candidate else None,
        emergency_contact_name=candidate.emergency_contact_name if candidate else None,
        emergency_contact_phone=candidate.emergency_contact_phone if candidate else None,
        institute_name=candidate.institute_name if candidate else None,
        qualification=candidate.qualification if candidate else None,
        course=candidate.course if candidate else None,
        year_of_study=candidate.year_of_study if candidate else None,
        graduation_year=candidate.graduation_year if candidate else None,
        bank_name=bank.bank_name if bank else None,
        account_number=bank.account_number if bank else None,
        ifsc_code=bank.ifsc_code if bank else None,
        account_holder_name=bank.account_holder_name if bank else None,
        account_type=bank.account_type if bank else None,
        self_review_submitted=record.self_review is not None and record.self_review.submitted_at is not None,
        self_review_enabled=record.self_review_enabled or False,
        hr_prefilled_fields=hr_prefilled,
    )


# ── Load portal info ──────────────────────────────────────────────────────────

@router.get("/portal/{token}", response_model=PortalInfo)
def get_portal_info(token: str, db: Session = Depends(get_db)):
    record = get_intern_from_token(token, db, track_access=False)
    record.portal_token_last_accessed = datetime.utcnow()
    record.portal_token_access_count = (record.portal_token_access_count or 0) + 1
    db.commit()
    annexures_signed = [
        sig.annexure_type.value
        for sig in record.annexure_signatures
        if sig.signed_at is not None
    ]
    return _build_portal_info(record, annexures_signed)


@router.get("/portal/{token}/refresh", response_model=PortalInfo)
def refresh_portal_info(token: str, db: Session = Depends(get_db)):
    record = get_intern_from_token(token, db, track_access=False)
    annexures_signed = [
        sig.annexure_type.value
        for sig in record.annexure_signatures
        if sig.signed_at is not None
    ]
    return _build_portal_info(record, annexures_signed)


# ── Submit personal + academic + bank details ─────────────────────────────────

@router.post("/portal/{token}/submit")
def submit_portal(
    token: str,
    payload: CandidatePortalSubmit,
    db: Session = Depends(get_db),
):
    record = get_intern_from_token(token, db, track_access=False)

    if record.status in ['offer_accepted', 'offer_declined', 'active', 'completed']:
        raise HTTPException(status_code=400, detail="Details cannot be changed after offer is accepted")

    candidate = record.candidate
    if not candidate:
        candidate = Candidate(intern_record_id=record.id)
        db.add(candidate)

    p = payload.personal
    candidate.full_name = p.full_name
    candidate.gender = p.gender
    candidate.dob = p.dob
    candidate.mobile = p.mobile
    candidate.contact_no = p.contact_no
    candidate.address = p.address
    candidate.city = p.city
    candidate.state = p.state
    candidate.pincode = p.pincode
    candidate.pan_card_no = p.pan_card_no
    candidate.aadhaar_no = p.aadhaar_no
    candidate.emergency_contact_name = p.emergency_contact_name
    candidate.emergency_contact_phone = p.emergency_contact_phone

    if payload.privacy_accepted:
        candidate.privacy_accepted = True
        candidate.privacy_accepted_at = datetime.utcnow()
    elif not candidate.privacy_accepted:
        raise HTTPException(status_code=400, detail="You must accept the privacy policy to continue")

    a = payload.academic
    candidate.institute_name = a.institute_name
    candidate.qualification = a.qualification
    candidate.course = a.course
    candidate.year_of_study = a.year_of_study
    candidate.graduation_year = a.graduation_year

    b = payload.bank
    bank = candidate.bank_details
    if not bank:
        bank = BankDetails(candidate_id=candidate.id)
        db.add(bank)
    bank.bank_name = b.bank_name
    bank.account_number = b.account_number
    bank.ifsc_code = b.ifsc_code
    bank.account_holder_name = b.account_holder_name
    bank.account_type = b.account_type

    record.portal_submitted_at = datetime.utcnow()
    record.status = InternStatus.portal_submitted

    db.commit()
    return {"message": "Details submitted successfully"}


# ── Upload document ───────────────────────────────────────────────────────────

@router.post("/portal/{token}/upload-document", response_model=DocumentOut)
async def upload_document(
    token: str,
    doc_type: DocType,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    record = get_intern_from_token(token, db)
    candidate = record.candidate

    if not candidate:
        raise HTTPException(status_code=400, detail="Please submit details before uploading documents")

    if file.content_type not in ["application/pdf"]:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_content, file_name, content_type = await read_upload(file)

    # Delete ALL existing records for this doc_type directly via query (not ORM cache)
    db.query(Document).filter(
        Document.candidate_id == candidate.id,
        Document.doc_type == doc_type
    ).delete(synchronize_session=False)
    db.flush()

    from app.models.models import DocStatus
    doc = Document(
        candidate_id=candidate.id,
        doc_type=doc_type,
        file_url=None,
        file_name=file_name,
        file_data=file_content,
        content_type=content_type,
        file_size_kb=len(file_content) // 1024,
        status=DocStatus.pending,
    )
    db.add(doc)
    record.status = InternStatus.docs_under_review
    db.commit()
    db.refresh(doc)
    log_action(db, str(record.id), None, "DOCUMENT_UPLOADED",
               entity_type="Document", entity_id=str(doc.id),
               field_changed="doc_type", new_value=str(doc_type).split(".")[-1],
               actor_label="Candidate")
    return {
        "id": doc.id,
        "doc_type": doc.doc_type,
        "file_name": doc.file_name,
        "file_url": doc.file_url,
        "file_size_kb": doc.file_size_kb,
        "file_data_available": doc.file_data is not None,
        "status": doc.status,
        "rejection_reason": doc.rejection_reason,
        "uploaded_at": doc.uploaded_at,
    }


# ── Sign Annexure A or B ──────────────────────────────────────────────────────

@router.post("/portal/{token}/sign-annexure", response_model=AnnexureSignOut)
def sign_annexure(
    token: str,
    payload: AnnexureSignIn,
    request: Request,
    db: Session = Depends(get_db),
):
    record = get_intern_from_token(token, db)

    existing = next(
        (s for s in record.annexure_signatures if s.annexure_type == payload.annexure_type),
        None
    )
    if existing and existing.signed_at:
        raise HTTPException(status_code=400, detail=f"Annexure {payload.annexure_type} already signed")

    if payload.annexure_type == AnnexureType.B:
        if not payload.pan_card_no or not payload.aadhaar_no:
            raise HTTPException(status_code=400, detail="PAN and Aadhaar required for Annexure B")

    sig = existing or AnnexureSignature(intern_record_id=record.id)
    sig.annexure_type = payload.annexure_type
    sig.signed_at = datetime.utcnow()
    sig.signed_place = payload.signed_place
    sig.university_name = payload.university_name
    sig.candidate_name = payload.candidate_name
    sig.pan_card_no = payload.pan_card_no
    sig.aadhaar_no = payload.aadhaar_no
    sig.ip_address = request.client.host

    if not existing:
        db.add(sig)

    db.commit()
    db.refresh(sig)
    return sig


# ── View offer letter ─────────────────────────────────────────────────────────

@router.get("/portal/{token}/offer-letter", response_model=OfferLetterOut)
def get_offer(token: str, db: Session = Depends(get_db)):
    record = get_intern_from_token(token, db)
    if not record.offer_letter or record.offer_letter.status == "draft":
        raise HTTPException(status_code=404, detail="Offer letter not yet available")
    return record.offer_letter


# ── Accept / Decline offer ────────────────────────────────────────────────────

@router.post("/portal/{token}/offer-response")
def respond_to_offer(
    token: str,
    payload: OfferResponseRequest,
    db: Session = Depends(get_db),
):
    record = get_intern_from_token(token, db)

    if not record.offer_letter:
        raise HTTPException(status_code=404, detail="No offer letter found")

    from app.models.models import OfferStatus
    valid_responses = ["accepted", "declined", "clarification_requested"]
    if payload.response not in valid_responses:
        raise HTTPException(status_code=400, detail=f"Response must be one of: {valid_responses}")

    record.offer_letter.candidate_response = payload.response
    record.offer_letter.candidate_remarks = payload.remarks
    record.offer_letter.responded_at = datetime.utcnow()
    record.offer_letter.status = payload.response

    if payload.response == "accepted":
        record.status = InternStatus.offer_accepted
        if not record.accounts_task:
            from app.models.models import AccountsTask, TaskStatus
            accounts_task = AccountsTask(
                intern_record_id=record.id,
                task_status=TaskStatus.pending,
            )
            db.add(accounts_task)
        if not record.it_task:
            from app.models.models import ITTask, TaskStatus
            it_task = ITTask(
                intern_record_id=record.id,
                laptop_required=record.laptop_required,
                email_required=record.corporate_email_required,
                other_assets=record.other_assets,
                task_status=TaskStatus.pending,
            )
            db.add(it_task)
    elif payload.response == "declined":
        record.status = InternStatus.offer_declined

    db.commit()
    action = "OFFER_ACCEPTED" if payload.response == "accepted" else \
             "OFFER_DECLINED" if payload.response == "declined" else "OFFER_CLARIFICATION_REQUESTED"
    log_action(db, str(record.id), None, action,
               entity_type="OfferLetter",
               new_value=payload.response,
               field_changed="candidate_response",
               actor_label="Candidate")
    return {"message": f"Response recorded: {payload.response}"}


# ── Student self-review ───────────────────────────────────────────────────────

@router.post("/portal/{token}/self-review")
def submit_self_review(
    token: str,
    payload: SelfReviewIn,
    db: Session = Depends(get_db),
):
    from app.models.models import SelfReview
    record = get_intern_from_token(token, db)

    if record.status not in ['offer_accepted', 'active', 'review_pending', 'completed']:
        raise HTTPException(status_code=400, detail="Self-review is available after accepting the offer")

    review = record.self_review
    if not review:
        review = SelfReview(intern_record_id=record.id)
        db.add(review)

    review.overall_experience = payload.overall_experience
    review.learning_rating = payload.learning_rating
    review.mentorship_rating = payload.mentorship_rating
    review.facilities_rating = payload.facilities_rating
    review.work_culture_rating = payload.work_culture_rating
    review.key_learnings = payload.key_learnings
    review.challenges_faced = payload.challenges_faced
    review.suggestions = payload.suggestions
    review.would_recommend = payload.would_recommend
    review.overall_feedback = payload.overall_feedback
    review.submitted_at = datetime.utcnow()

    # Update intern status to completed after self-review
    if record.status in [InternStatus.review_pending, InternStatus.active, InternStatus.offer_accepted]:
        record.status = InternStatus.completed

    db.commit()
    log_action(db, str(record.id), None, "SELF_REVIEW_SUBMITTED",
               entity_type="SelfReview",
               new_value=f"overall_experience={payload.overall_experience}/5",
               actor_label="Candidate")
    return {"message": "Self-review submitted successfully"}


@router.get("/portal/{token}/self-review")
def get_self_review(token: str, db: Session = Depends(get_db)):
    record = get_intern_from_token(token, db)
    return record.self_review


# ── Get documents list ────────────────────────────────────────────────────────

@router.get("/portal/{token}/documents", response_model=List[DocumentOut])
def get_documents(token: str, db: Session = Depends(get_db)):
    record = get_intern_from_token(token, db)
    if not record.candidate:
        return []
    docs = db.query(Document).filter(
        Document.candidate_id == record.candidate.id
    ).all()
    # Return dicts with file_data_available explicitly set
    # so Pydantic doesn't need from_orm to compute it
    return [
        {
            "id": doc.id,
            "doc_type": doc.doc_type,
            "file_name": doc.file_name,
            "file_url": doc.file_url,
            "file_size_kb": doc.file_size_kb,
            "file_data_available": doc.file_data is not None,
            "status": doc.status,
            "rejection_reason": doc.rejection_reason,
            "uploaded_at": doc.uploaded_at,
        }
        for doc in docs
    ]

# ── File download endpoints ───────────────────────────────────────────────────

@router.get("/portal/{token}/document/{doc_id}/download")
def candidate_download_document(
    token: str,
    doc_id: UUID,
    db: Session = Depends(get_db),
):
    from fastapi.responses import Response
    record = get_intern_from_token(token, db, track_access=False)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not record.candidate or doc.candidate_id != record.candidate.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not doc.file_data:
        raise HTTPException(status_code=404, detail="File data not found")
    return Response(
        content=doc.file_data,
        media_type=doc.content_type or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc.file_name or "document.pdf"}"'}
    )


@router.get("/portal/{token}/offer-letter/download")
def candidate_download_offer(token: str, db: Session = Depends(get_db)):
    from fastapi.responses import Response
    record = get_intern_from_token(token, db, track_access=False)
    if not record.offer_letter or not record.offer_letter.file_data:
        raise HTTPException(status_code=404, detail="Offer letter not available")
    offer = record.offer_letter
    return Response(
        content=offer.file_data,
        media_type=offer.content_type or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{offer.file_name or "offer_letter.pdf"}"'}
    )


@router.get("/portal/{token}/certificate/download")
def candidate_download_certificate(token: str, db: Session = Depends(get_db)):
    from fastapi.responses import Response
    record = get_intern_from_token(token, db, track_access=False)
    if not record.experience_certificate or not record.experience_certificate.file_data:
        raise HTTPException(status_code=404, detail="Certificate not available yet")
    cert = record.experience_certificate
    return Response(
        content=cert.file_data,
        media_type=cert.content_type or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{cert.file_name or "certificate.pdf"}"'}
    )