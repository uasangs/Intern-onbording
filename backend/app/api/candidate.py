# from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
# from sqlalchemy.orm import Session
# from typing import List
# from datetime import datetime
# from uuid import UUID

# from app.core.database import get_db
# from app.core.security import decode_portal_token
# from app.models.models import (
#     InternRecord, Candidate, BankDetails, Document,
#     AnnexureSignature, InternStatus, DocType, AnnexureType
# )
# from app.schemas.schemas import (
#     CandidatePortalSubmit, CandidateOut, BankDetailsOut,
#     DocumentOut, AnnexureSignIn, AnnexureSignOut,
#     OfferResponseRequest, PortalInfo, OfferLetterOut, SelfReviewIn
# )
# from app.services.file_service import save_upload

# router = APIRouter(prefix="/candidate", tags=["Candidate Portal"])


# def get_intern_from_token(token: str, db: Session, track_access: bool = False) -> InternRecord:
#     intern_id = decode_portal_token(token)
#     if not intern_id:
#         raise HTTPException(status_code=401, detail="Invalid or expired portal link")
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Record not found")
#     # Check if HR has manually revoked this token
#     if record.portal_token_revoked:
#         raise HTTPException(
#             status_code=401,
#             detail="This portal link has been revoked by HR. Please contact HR for a new link."
#         )
#     # Track access — update last accessed time and count
#     if track_access:
#         record.portal_token_last_accessed = datetime.utcnow()
#         record.portal_token_access_count = (record.portal_token_access_count or 0) + 1
#         db.commit()
#     return record


# # ── Load portal info (what candidate sees on opening link) ────────────────────

# @router.get("/portal/{token}", response_model=PortalInfo)
# def get_portal_info(token: str, db: Session = Depends(get_db)):
#     # Count every time candidate opens the portal link
#     record = get_intern_from_token(token, db, track_access=False)
#     record.portal_token_last_accessed = datetime.utcnow()
#     record.portal_token_access_count = (record.portal_token_access_count or 0) + 1
#     db.commit()
#     annexures_signed = [
#         sig.annexure_type.value
#         for sig in record.annexure_signatures
#         if sig.signed_at is not None
#     ]

#     candidate = record.candidate
#     bank = candidate.bank_details if candidate else None
#     return PortalInfo(
#         intern_record_id=record.id,
#         candidate_email=record.candidate_email,
#         role_title=record.role_title,
#         department=record.department,
#         location=record.location,
#         start_date=record.start_date,
#         end_date=record.end_date,
#         stipend_amount=record.stipend_amount,
#         status=record.status,
#         portal_submitted=record.portal_submitted_at is not None,
#         offer_status=record.offer_letter.status if record.offer_letter else None,
#         annexures_signed=annexures_signed,
#         candidate_name=candidate.full_name if candidate else None,
#         gender=candidate.gender if candidate else None,
#         dob=str(candidate.dob) if candidate and candidate.dob else None,
#         mobile=candidate.mobile if candidate else None,
#         contact_no=candidate.contact_no if candidate else None,
#         address=candidate.address if candidate else None,
#         city=candidate.city if candidate else None,
#         state=candidate.state if candidate else None,
#         pincode=candidate.pincode if candidate else None,
#         pan_card_no=candidate.pan_card_no if candidate else None,
#         aadhaar_no=candidate.aadhaar_no if candidate else None,
#         emergency_contact_name=candidate.emergency_contact_name if candidate else None,
#         emergency_contact_phone=candidate.emergency_contact_phone if candidate else None,
#         institute_name=candidate.institute_name if candidate else None,
#         qualification=candidate.qualification if candidate else None,
#         course=candidate.course if candidate else None,
#         year_of_study=candidate.year_of_study if candidate else None,
#         graduation_year=candidate.graduation_year if candidate else None,
#         bank_name=bank.bank_name if bank else None,
#         account_number=bank.account_number if bank else None,
#         ifsc_code=bank.ifsc_code if bank else None,
#         account_holder_name=bank.account_holder_name if bank else None,
#         account_type=bank.account_type if bank else None,
#     )


# @router.get("/portal/{token}/refresh", response_model=PortalInfo)
# def refresh_portal_info(token: str, db: Session = Depends(get_db)):
#     # Silent refresh — does NOT increment access count
#     record = get_intern_from_token(token, db, track_access=False)
#     annexures_signed = [
#         sig.annexure_type.value
#         for sig in record.annexure_signatures
#         if sig.signed_at is not None
#     ]

#     candidate = record.candidate
#     bank = candidate.bank_details if candidate else None
#     return PortalInfo(
#         intern_record_id=record.id,
#         candidate_email=record.candidate_email,
#         role_title=record.role_title,
#         department=record.department,
#         location=record.location,
#         start_date=record.start_date,
#         end_date=record.end_date,
#         stipend_amount=record.stipend_amount,
#         status=record.status,
#         portal_submitted=record.portal_submitted_at is not None,
#         offer_status=record.offer_letter.status if record.offer_letter else None,
#         annexures_signed=annexures_signed,
#         candidate_name=candidate.full_name if candidate else None,
#         gender=candidate.gender if candidate else None,
#         dob=str(candidate.dob) if candidate and candidate.dob else None,
#         mobile=candidate.mobile if candidate else None,
#         contact_no=candidate.contact_no if candidate else None,
#         address=candidate.address if candidate else None,
#         city=candidate.city if candidate else None,
#         state=candidate.state if candidate else None,
#         pincode=candidate.pincode if candidate else None,
#         pan_card_no=candidate.pan_card_no if candidate else None,
#         aadhaar_no=candidate.aadhaar_no if candidate else None,
#         emergency_contact_name=candidate.emergency_contact_name if candidate else None,
#         emergency_contact_phone=candidate.emergency_contact_phone if candidate else None,
#         institute_name=candidate.institute_name if candidate else None,
#         qualification=candidate.qualification if candidate else None,
#         course=candidate.course if candidate else None,
#         year_of_study=candidate.year_of_study if candidate else None,
#         graduation_year=candidate.graduation_year if candidate else None,
#         bank_name=bank.bank_name if bank else None,
#         account_number=bank.account_number if bank else None,
#         ifsc_code=bank.ifsc_code if bank else None,
#         account_holder_name=bank.account_holder_name if bank else None,
#         account_type=bank.account_type if bank else None,
#     )


# # ── Submit personal + academic + bank details ─────────────────────────────────

# @router.post("/portal/{token}/submit")
# def submit_portal(
#     token: str,
#     payload: CandidatePortalSubmit,
#     db: Session = Depends(get_db),
# ):
#     record = get_intern_from_token(token, db, track_access=False)

#     # Allow re-submission — candidate can update details anytime
#     # (unless offer already accepted/declined)
#     if record.status in ['offer_accepted', 'offer_declined', 'active', 'completed']:
#         raise HTTPException(status_code=400, detail="Details cannot be changed after offer is accepted")

#     candidate = record.candidate
#     if not candidate:
#         candidate = Candidate(intern_record_id=record.id)
#         db.add(candidate)

#     # Personal details
#     p = payload.personal
#     candidate.full_name = p.full_name
#     candidate.gender = p.gender
#     candidate.dob = p.dob
#     candidate.mobile = p.mobile
#     candidate.contact_no = p.contact_no
#     candidate.address = p.address
#     candidate.city = p.city
#     candidate.state = p.state
#     candidate.pincode = p.pincode
#     candidate.pan_card_no = p.pan_card_no
#     candidate.aadhaar_no = p.aadhaar_no
#     candidate.emergency_contact_name = p.emergency_contact_name
#     candidate.emergency_contact_phone = p.emergency_contact_phone

#     # Privacy policy acceptance
#     if payload.privacy_accepted:
#         candidate.privacy_accepted = True
#         candidate.privacy_accepted_at = datetime.utcnow()
#     elif not candidate.privacy_accepted:
#         raise HTTPException(status_code=400, detail="You must accept the privacy policy to continue")

#     # Academic details
#     a = payload.academic
#     candidate.institute_name = a.institute_name
#     candidate.qualification = a.qualification
#     candidate.course = a.course
#     candidate.year_of_study = a.year_of_study
#     candidate.graduation_year = a.graduation_year

#     # Bank details
#     b = payload.bank
#     bank = candidate.bank_details
#     if not bank:
#         bank = BankDetails(candidate_id=candidate.id)
#         db.add(bank)
#     bank.bank_name = b.bank_name
#     bank.account_number = b.account_number
#     bank.ifsc_code = b.ifsc_code
#     bank.account_holder_name = b.account_holder_name
#     bank.account_type = b.account_type

#     record.portal_submitted_at = datetime.utcnow()
#     record.status = InternStatus.portal_submitted

#     db.commit()
#     return {"message": "Details submitted successfully"}


# # ── Upload document ───────────────────────────────────────────────────────────

# @router.post("/portal/{token}/upload-document", response_model=DocumentOut)
# async def upload_document(
#     token: str,
#     doc_type: DocType,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
# ):
#     record = get_intern_from_token(token, db)
#     candidate = record.candidate

#     if not candidate:
#         raise HTTPException(status_code=400, detail="Please submit details before uploading documents")

#     # Validate file type - PDF only for documents
#     if file.content_type not in ["application/pdf"]:
#         raise HTTPException(status_code=400, detail="Only PDF files are accepted. Please upload a PDF scan of your document.")

#     file_url = await save_upload(file, folder="documents")

#     # Remove existing doc of same type if exists
#     existing = next((d for d in candidate.documents if d.doc_type == doc_type), None)
#     if existing:
#         db.delete(existing)

#     from app.models.models import DocStatus
#     doc = Document(
#         candidate_id=candidate.id,
#         doc_type=doc_type,
#         file_url=file_url,
#         file_name=file.filename,
#         status=DocStatus.pending,
#     )
#     db.add(doc)
#     record.status = InternStatus.docs_under_review
#     db.commit()
#     db.refresh(doc)
#     return doc


# # ── Sign Annexure A or B ──────────────────────────────────────────────────────

# @router.post("/portal/{token}/sign-annexure", response_model=AnnexureSignOut)
# def sign_annexure(
#     token: str,
#     payload: AnnexureSignIn,
#     request: Request,
#     db: Session = Depends(get_db),
# ):
#     record = get_intern_from_token(token, db)

#     # Check if already signed
#     existing = next(
#         (s for s in record.annexure_signatures if s.annexure_type == payload.annexure_type),
#         None
#     )
#     if existing and existing.signed_at:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Annexure {payload.annexure_type} already signed"
#         )

#     # Annexure B requires PAN and Aadhaar
#     if payload.annexure_type == AnnexureType.B:
#         if not payload.pan_card_no or not payload.aadhaar_no:
#             raise HTTPException(
#                 status_code=400,
#                 detail="PAN card number and Aadhaar number are required for Annexure B"
#             )

#     sig = existing or AnnexureSignature(intern_record_id=record.id)
#     sig.annexure_type = payload.annexure_type
#     sig.signed_at = datetime.utcnow()
#     sig.signed_place = payload.signed_place
#     sig.university_name = payload.university_name
#     sig.candidate_name = payload.candidate_name
#     sig.pan_card_no = payload.pan_card_no
#     sig.aadhaar_no = payload.aadhaar_no
#     sig.ip_address = request.client.host

#     if not existing:
#         db.add(sig)

#     db.commit()
#     db.refresh(sig)
#     return sig


# # ── View offer letter ─────────────────────────────────────────────────────────

# @router.get("/portal/{token}/offer-letter", response_model=OfferLetterOut)
# def get_offer(token: str, db: Session = Depends(get_db)):
#     record = get_intern_from_token(token, db)
#     if not record.offer_letter:
#         raise HTTPException(status_code=404, detail="Offer letter not yet available")
#     return record.offer_letter


# # ── Accept / Decline offer ────────────────────────────────────────────────────

# @router.post("/portal/{token}/offer-response")
# def respond_to_offer(
#     token: str,
#     payload: OfferResponseRequest,
#     db: Session = Depends(get_db),
# ):
#     record = get_intern_from_token(token, db)

#     if not record.offer_letter:
#         raise HTTPException(status_code=404, detail="No offer letter found")

#     from app.models.models import OfferStatus
#     valid_responses = ["accepted", "declined", "clarification_requested"]
#     if payload.response not in valid_responses:
#         raise HTTPException(status_code=400, detail=f"Response must be one of: {valid_responses}")

#     record.offer_letter.candidate_response = payload.response
#     record.offer_letter.candidate_remarks = payload.remarks
#     record.offer_letter.responded_at = datetime.utcnow()
#     record.offer_letter.status = payload.response

#     if payload.response == "accepted":
#         record.status = InternStatus.offer_accepted
#         # Activate accounts and IT tasks
#         if record.accounts_task:
#             record.accounts_task.task_status = "pending"
#         if record.it_task:
#             record.it_task.task_status = "pending"
#     elif payload.response == "declined":
#         record.status = InternStatus.offer_declined

#     db.commit()
#     return {"message": f"Response recorded: {payload.response}"}


# # ── Student self-review ──────────────────────────────────────────────────────

# @router.post("/portal/{token}/self-review")
# def submit_self_review(
#     token: str,
#     payload: SelfReviewIn,
#     db: Session = Depends(get_db),
# ):
#     from app.models.models import SelfReview
#     record = get_intern_from_token(token, db)

#     # Only allow self-review after offer is accepted
#     if record.status not in ['offer_accepted', 'active', 'review_pending', 'completed']:
#         raise HTTPException(status_code=400, detail="Self-review is available after accepting the offer")

#     review = record.self_review
#     if not review:
#         review = SelfReview(intern_record_id=record.id)
#         db.add(review)

#     review.overall_experience = payload.overall_experience
#     review.learning_rating = payload.learning_rating
#     review.mentorship_rating = payload.mentorship_rating
#     review.facilities_rating = payload.facilities_rating
#     review.work_culture_rating = payload.work_culture_rating
#     review.key_learnings = payload.key_learnings
#     review.challenges_faced = payload.challenges_faced
#     review.suggestions = payload.suggestions
#     review.would_recommend = payload.would_recommend
#     review.overall_feedback = payload.overall_feedback
#     review.submitted_at = datetime.utcnow()

#     db.commit()
#     return {"message": "Self-review submitted successfully"}


# @router.get("/portal/{token}/self-review")
# def get_self_review(token: str, db: Session = Depends(get_db)):
#     record = get_intern_from_token(token, db)
#     return record.self_review


# # ── Get documents list ────────────────────────────────────────────────────────

# @router.get("/portal/{token}/documents", response_model=List[DocumentOut])
# def get_documents(token: str, db: Session = Depends(get_db)):
#     record = get_intern_from_token(token, db)
#     if not record.candidate:
#         return []
#     return record.candidate.documents



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
from app.services.file_service import save_upload

router = APIRouter(prefix="/candidate", tags=["Candidate Portal"])


def get_intern_from_token(token: str, db: Session, track_access: bool = False) -> InternRecord:
    intern_id = decode_portal_token(token)
    if not intern_id:
        raise HTTPException(status_code=401, detail="Invalid or expired portal link")
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    # Check if HR has manually revoked this token
    if record.portal_token_revoked:
        raise HTTPException(
            status_code=401,
            detail="This portal link has been revoked by HR. Please contact HR for a new link."
        )
    # Track access — update last accessed time and count
    if track_access:
        record.portal_token_last_accessed = datetime.utcnow()
        record.portal_token_access_count = (record.portal_token_access_count or 0) + 1
        db.commit()
    return record


# ── Load portal info (what candidate sees on opening link) ────────────────────

@router.get("/portal/{token}", response_model=PortalInfo)
def get_portal_info(token: str, db: Session = Depends(get_db)):
    # Count every time candidate opens the portal link
    record = get_intern_from_token(token, db, track_access=False)
    record.portal_token_last_accessed = datetime.utcnow()
    record.portal_token_access_count = (record.portal_token_access_count or 0) + 1
    db.commit()
    annexures_signed = [
        sig.annexure_type.value
        for sig in record.annexure_signatures
        if sig.signed_at is not None
    ]

    candidate = record.candidate
    bank = candidate.bank_details if candidate else None
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
    )


@router.get("/portal/{token}/refresh", response_model=PortalInfo)
def refresh_portal_info(token: str, db: Session = Depends(get_db)):
    # Silent refresh — does NOT increment access count
    record = get_intern_from_token(token, db, track_access=False)
    annexures_signed = [
        sig.annexure_type.value
        for sig in record.annexure_signatures
        if sig.signed_at is not None
    ]

    candidate = record.candidate
    bank = candidate.bank_details if candidate else None
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
    )


# ── Submit personal + academic + bank details ─────────────────────────────────

@router.post("/portal/{token}/submit")
def submit_portal(
    token: str,
    payload: CandidatePortalSubmit,
    db: Session = Depends(get_db),
):
    record = get_intern_from_token(token, db, track_access=False)

    # Allow re-submission — candidate can update details anytime
    # (unless offer already accepted/declined)
    if record.status in ['offer_accepted', 'offer_declined', 'active', 'completed']:
        raise HTTPException(status_code=400, detail="Details cannot be changed after offer is accepted")

    candidate = record.candidate
    if not candidate:
        candidate = Candidate(intern_record_id=record.id)
        db.add(candidate)

    # Personal details
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

    # Privacy policy acceptance
    if payload.privacy_accepted:
        candidate.privacy_accepted = True
        candidate.privacy_accepted_at = datetime.utcnow()
    elif not candidate.privacy_accepted:
        raise HTTPException(status_code=400, detail="You must accept the privacy policy to continue")

    # Academic details
    a = payload.academic
    candidate.institute_name = a.institute_name
    candidate.qualification = a.qualification
    candidate.course = a.course
    candidate.year_of_study = a.year_of_study
    candidate.graduation_year = a.graduation_year

    # Bank details
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

    # Validate file type - PDF only for documents
    if file.content_type not in ["application/pdf"]:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted. Please upload a PDF scan of your document.")

    file_url = await save_upload(file, folder="documents")

    # Remove existing doc of same type if exists
    existing = next((d for d in candidate.documents if d.doc_type == doc_type), None)
    if existing:
        db.delete(existing)

    from app.models.models import DocStatus
    doc = Document(
        candidate_id=candidate.id,
        doc_type=doc_type,
        file_url=file_url,
        file_name=file.filename,
        status=DocStatus.pending,
    )
    db.add(doc)
    record.status = InternStatus.docs_under_review
    db.commit()
    db.refresh(doc)
    return doc


# ── Sign Annexure A or B ──────────────────────────────────────────────────────

@router.post("/portal/{token}/sign-annexure", response_model=AnnexureSignOut)
def sign_annexure(
    token: str,
    payload: AnnexureSignIn,
    request: Request,
    db: Session = Depends(get_db),
):
    record = get_intern_from_token(token, db)

    # Check if already signed
    existing = next(
        (s for s in record.annexure_signatures if s.annexure_type == payload.annexure_type),
        None
    )
    if existing and existing.signed_at:
        raise HTTPException(
            status_code=400,
            detail=f"Annexure {payload.annexure_type} already signed"
        )

    # Annexure B requires PAN and Aadhaar
    if payload.annexure_type == AnnexureType.B:
        if not payload.pan_card_no or not payload.aadhaar_no:
            raise HTTPException(
                status_code=400,
                detail="PAN card number and Aadhaar number are required for Annexure B"
            )

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
    # Only expose offer letter AFTER HR has explicitly sent it
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
        # Activate accounts and IT tasks
        if record.accounts_task:
            record.accounts_task.task_status = "pending"
        if record.it_task:
            record.it_task.task_status = "pending"
    elif payload.response == "declined":
        record.status = InternStatus.offer_declined

    db.commit()
    return {"message": f"Response recorded: {payload.response}"}


# ── Student self-review ──────────────────────────────────────────────────────

@router.post("/portal/{token}/self-review")
def submit_self_review(
    token: str,
    payload: SelfReviewIn,
    db: Session = Depends(get_db),
):
    from app.models.models import SelfReview
    record = get_intern_from_token(token, db)

    # Only allow self-review after offer is accepted
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

    db.commit()
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
    return record.candidate.documents