# # from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
# # from sqlalchemy.orm import Session
# # from sqlalchemy import func
# # from typing import List, Optional
# # from uuid import UUID
# # from datetime import datetime, date
# # import math

# # from app.core.database import get_db
# # from app.core.security import require_hr, get_current_user, create_portal_token
# # from app.models.models import (
# #     HRUser, InternRecord, Candidate, Document, OfferLetter,
# #     AccountsTask, ITTask, ManagerReview, InternStatus, DocStatus, TaskStatus, MasterData
# # )
# # from app.schemas.schemas import (
# #     InternInitiateRequest, InternRecordOut, InternListItem,
# #     DocumentOut, DocVerifyRequest, DashboardStats, StatusUpdateRequest,
# #     OfferLetterOut, CertificateIn, CertificateOut
# # )
# # from app.services.email_service import send_portal_link_email
# # from app.services.pdf_service import generate_offer_letter_pdf, generate_certificate_pdf
# # from app.services.audit_service import log_action
# # from app.services.file_service import save_upload
# # from app.core.config import settings

# # router = APIRouter(prefix="/hr", tags=["HR"])


# # # ── Dashboard ─────────────────────────────────────────────────────────────────

# # @router.get("/dashboard", response_model=DashboardStats)
# # def get_dashboard(
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     total = db.query(InternRecord).count()
# #     active = db.query(InternRecord).filter(InternRecord.status == InternStatus.active).count()
# #     pending_docs = db.query(InternRecord).filter(
# #         InternRecord.status == InternStatus.docs_under_review
# #     ).count()
# #     pending_offer = db.query(InternRecord).filter(
# #         InternRecord.status == InternStatus.offer_sent
# #     ).count()
# #     pending_review = db.query(InternRecord).filter(
# #         InternRecord.status == InternStatus.review_pending
# #     ).count()
# #     certs_issued = db.query(InternRecord).filter(
# #         InternRecord.experience_certificate_issued == True
# #     ).count()
# #     completed = db.query(InternRecord).filter(
# #         InternRecord.status == InternStatus.completed
# #     ).count()
# #     completion_rate = round((completed / total * 100) if total > 0 else 0, 1)

# #     return DashboardStats(
# #         total_interns=total,
# #         active_interns=active,
# #         pending_docs_verification=pending_docs,
# #         pending_offer_response=pending_offer,
# #         pending_manager_review=pending_review,
# #         certificates_issued=certs_issued,
# #         completion_rate=completion_rate,
# #     )


# # # ── List all interns ──────────────────────────────────────────────────────────

# # @router.get("/interns", response_model=List[InternListItem])
# # def list_interns(
# #     status: Optional[str] = None,
# #     department: Optional[str] = None,
# #     location: Optional[str] = None,
# #     search: Optional[str] = None,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     query = db.query(InternRecord)

# #     if status:
# #         query = query.filter(InternRecord.status == status)
# #     if department:
# #         query = query.filter(InternRecord.department == department)
# #     if location:
# #         query = query.filter(InternRecord.location == location)
# #     if search:
# #         query = query.join(Candidate, isouter=True).filter(
# #             (InternRecord.candidate_email.ilike(f"%{search}%")) |
# #             (Candidate.full_name.ilike(f"%{search}%")) |
# #             (Candidate.institute_name.ilike(f"%{search}%"))
# #         )

# #     records = query.order_by(InternRecord.created_at.desc()).all()

# #     result = []
# #     for r in records:
# #         item = InternListItem(
# #             id=r.id,
# #             serial_no=r.serial_no,
# #             candidate_email=r.candidate_email,
# #             role_title=r.role_title,
# #             department=r.department,
# #             location=r.location,
# #             start_date=r.start_date,
# #             end_date=r.end_date,
# #             stipend_amount=r.stipend_amount,
# #             status=r.status,
# #             experience_certificate_issued=r.experience_certificate_issued,
# #             candidate_name=r.candidate.full_name if r.candidate else None,
# #             institute_name=r.candidate.institute_name if r.candidate else None,
# #         )
# #         result.append(item)
# #     return result


# # # ── Initiate new intern ───────────────────────────────────────────────────────

# # @router.post("/initiate", response_model=InternRecordOut)
# # def initiate_intern(
# #     payload: InternInitiateRequest,
# #     background_tasks: BackgroundTasks,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     # Calculate duration in weeks
# #     delta = payload.end_date - payload.start_date
# #     duration_weeks = math.ceil(delta.days / 7)

# #     # Generate portal token
# #     portal_token = create_portal_token("temp")  # will update after record creation

# #     record = InternRecord(
# #         initiated_by=current_user.id,
# #         candidate_email=str(payload.candidate_email),
# #         role_title=payload.role_title,
# #         department=payload.department,
# #         location=payload.location,
# #         source=payload.source,
# #         start_date=payload.start_date,
# #         end_date=payload.end_date,
# #         duration_weeks=duration_weeks,
# #         stipend_amount=payload.stipend_amount,
# #         reporting_manager_id=payload.reporting_manager_id,
# #         laptop_required=payload.laptop_required,
# #         corporate_email_required=payload.corporate_email_required,
# #         other_assets=payload.other_assets,
# #         notes_for_accounts=payload.notes_for_accounts,
# #         review_due_date=payload.review_due_date,
# #         status=InternStatus.initiated,
# #     )
# #     db.add(record)
# #     db.commit()
# #     db.refresh(record)

# #     # Create real portal token with actual record id
# #     real_token = create_portal_token(str(record.id))
# #     record.portal_token = real_token
# #     record.portal_token_sent_at = datetime.utcnow()
# #     record.status = InternStatus.portal_pending

# #     # Create empty candidate record
# #     candidate = Candidate(intern_record_id=record.id)
# #     db.add(candidate)

# #     # Create accounts task (if stipend info present)
# #     accounts_task = AccountsTask(
# #         intern_record_id=record.id,
# #         task_status=TaskStatus.pending,
# #     )
# #     db.add(accounts_task)

# #     # Create IT task if assets needed
# #     it_task = ITTask(
# #         intern_record_id=record.id,
# #         laptop_required=payload.laptop_required,
# #         email_required=payload.corporate_email_required,
# #         other_assets=payload.other_assets,
# #         task_status=TaskStatus.pending,
# #     )
# #     db.add(it_task)

# #     db.commit()
# #     db.refresh(record)

# #     # Send portal link email in background
# #     portal_url = f"{settings.FRONTEND_URL}/portal/{real_token}"
# #     background_tasks.add_task(
# #         send_portal_link_email,
# #         to_email=str(payload.candidate_email),
# #         candidate_name="Candidate",
# #         portal_url=portal_url,
# #         role_title=payload.role_title,
# #         location=payload.location,
# #         start_date=str(payload.start_date),
# #     )

# #     log_action(db, str(record.id), str(current_user.id), "INTERN_INITIATED",
# #                entity_type="InternRecord", entity_id=str(record.id))

# #     return record


# # # ── Get single intern detail ──────────────────────────────────────────────────

# # @router.get("/intern/{intern_id}", response_model=InternRecordOut)
# # def get_intern(
# #     intern_id: UUID,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Intern record not found")
# #     return record


# # # ── Get intern documents ──────────────────────────────────────────────────────

# # @router.get("/intern/{intern_id}/documents", response_model=List[DocumentOut])
# # def get_intern_documents(
# #     intern_id: UUID,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record or not record.candidate:
# #         raise HTTPException(status_code=404, detail="Not found")
# #     return record.candidate.documents


# # # ── Verify / reject a document ────────────────────────────────────────────────

# # @router.patch("/document/{doc_id}/verify", response_model=DocumentOut)
# # def verify_document(
# #     doc_id: UUID,
# #     payload: DocVerifyRequest,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     doc = db.query(Document).filter(Document.id == doc_id).first()
# #     if not doc:
# #         raise HTTPException(status_code=404, detail="Document not found")

# #     doc.status = payload.status
# #     doc.rejection_reason = payload.rejection_reason
# #     doc.verified_by_id = current_user.id
# #     doc.verified_at = datetime.utcnow()

# #     # If all docs approved → update intern status
# #     candidate = doc.candidate
# #     all_docs = candidate.documents
# #     if all(d.status == DocStatus.approved for d in all_docs) and len(all_docs) > 0:
# #         candidate.intern_record.status = InternStatus.docs_approved

# #     db.commit()
# #     db.refresh(doc)
# #     return doc


# # # ── Generate offer letter PDF ─────────────────────────────────────────────────

# # @router.post("/intern/{intern_id}/offer-letter/generate", response_model=OfferLetterOut)
# # async def generate_offer(
# #     intern_id: UUID,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")

# #     pdf_url = await generate_offer_letter_pdf(record)

# #     offer = record.offer_letter
# #     if not offer:
# #         offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
# #         db.add(offer)

# #     offer.pdf_url = pdf_url
# #     offer.is_hr_uploaded = False
# #     from app.models.models import OfferStatus
# #     offer.status = OfferStatus.draft
# #     offer.generated_by = current_user.id

# #     db.commit()
# #     db.refresh(offer)
# #     return offer


# # # ── HR uploads offer letter manually (override) ───────────────────────────────

# # @router.post("/intern/{intern_id}/offer-letter/upload", response_model=OfferLetterOut)
# # async def upload_offer(
# #     intern_id: UUID,
# #     file: UploadFile = File(...),
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")

# #     file_url = await save_upload(file, folder="offer_letters")

# #     offer = record.offer_letter
# #     if not offer:
# #         offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
# #         db.add(offer)

# #     offer.pdf_url = file_url
# #     offer.is_hr_uploaded = True
# #     db.commit()
# #     db.refresh(offer)
# #     return offer


# # # ── Send offer letter to candidate ────────────────────────────────────────────

# # @router.post("/intern/{intern_id}/offer-letter/send")
# # def send_offer(
# #     intern_id: UUID,
# #     background_tasks: BackgroundTasks,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record or not record.offer_letter:
# #         raise HTTPException(status_code=404, detail="Offer letter not generated yet")

# #     from app.models.models import OfferStatus
# #     record.offer_letter.status = OfferStatus.sent
# #     record.offer_letter.sent_at = datetime.utcnow()
# #     record.status = InternStatus.offer_sent

# #     db.commit()

# #     from app.services.email_service import send_offer_email
# #     portal_url = f"{settings.FRONTEND_URL}/portal/{record.portal_token}"
# #     background_tasks.add_task(
# #         send_offer_email,
# #         to_email=record.candidate_email,
# #         candidate_name=record.candidate.full_name if record.candidate else "Candidate",
# #         portal_url=portal_url,
# #         offer_pdf_url=record.offer_letter.pdf_url,
# #     )
# #     return {"message": "Offer letter sent successfully"}


# # # ── Generate experience certificate ──────────────────────────────────────────

# # @router.post("/intern/{intern_id}/certificate/generate", response_model=CertificateOut)
# # async def generate_certificate(
# #     intern_id: UUID,
# #     payload: CertificateIn,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")

# #     from app.models.models import ExperienceCertificate
# #     pdf_url = await generate_certificate_pdf(record, payload)

# #     cert = record.experience_certificate
# #     if not cert:
# #         cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
# #         db.add(cert)

# #     cert.pdf_url = pdf_url
# #     cert.project_title = payload.project_title
# #     cert.guide_names = payload.guide_names
# #     cert.conduct_remark = payload.conduct_remark
# #     cert.issue_date = payload.issue_date
# #     cert.is_hr_uploaded = False
# #     cert.issued_by = current_user.id

# #     record.experience_certificate_issued = True
# #     record.status = InternStatus.completed

# #     db.commit()
# #     db.refresh(cert)
# #     return cert


# # # ── Upload certificate manually (override) ────────────────────────────────────

# # @router.post("/intern/{intern_id}/certificate/upload", response_model=CertificateOut)
# # async def upload_certificate(
# #     intern_id: UUID,
# #     file: UploadFile = File(...),
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")

# #     file_url = await save_upload(file, folder="certificates")

# #     from app.models.models import ExperienceCertificate
# #     cert = record.experience_certificate
# #     if not cert:
# #         cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
# #         db.add(cert)

# #     cert.pdf_url = file_url
# #     cert.is_hr_uploaded = True
# #     record.experience_certificate_issued = True

# #     db.commit()
# #     db.refresh(cert)
# #     return cert


# # # ── Export FY tracker as Excel ────────────────────────────────────────────────

# # @router.get("/export/excel")
# # def export_excel(
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     from app.services.excel_service import generate_fy_tracker_excel
# #     from fastapi.responses import StreamingResponse
# #     import io

# #     output = generate_fy_tracker_excel(db)
# #     return StreamingResponse(
# #         io.BytesIO(output),
# #         media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
# #         headers={"Content-Disposition": "attachment; filename=FY_Intern_Tracker.xlsx"},
# #     )


# # # ── HR view of Accounts task for an intern ───────────────────────────────────

# # @router.get("/intern/{intern_id}/accounts-task")
# # def get_accounts_task_for_hr(
# #     intern_id: UUID,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     """HR read-only view of accounts task for an intern."""
# #     from app.models.models import AccountsTask
# #     from app.api.operations import _build_accounts_task
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")
# #     if not record.accounts_task:
# #         return None
# #     return _build_accounts_task(record.accounts_task)


# # # ── HR view of IT task for an intern ──────────────────────────────────────────

# # @router.get("/intern/{intern_id}/it-task")
# # def get_it_task_for_hr(
# #     intern_id: UUID,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     """HR read-only view of IT task for an intern."""
# #     from app.models.models import ITTask
# #     from app.api.operations import _build_it_task
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")
# #     if not record.it_task:
# #         return None
# #     return _build_it_task(record.it_task)


# # # ── Update intern status manually ─────────────────────────────────────────────

# # @router.patch("/intern/{intern_id}/status")
# # def update_status(
# #     intern_id: UUID,
# #     payload: StatusUpdateRequest,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")

# #     old_status = record.status
# #     record.status = payload.status
# #     db.commit()

# #     log_action(db, str(record.id), str(current_user.id), "STATUS_CHANGED",
# #                field_changed="status", old_value=str(old_status), new_value=str(payload.status))
# #     return {"message": "Status updated"}


# # # ── Portal link management ────────────────────────────────────────────────────

# # @router.get("/intern/{intern_id}/portal-status")
# # def get_portal_status(
# #     intern_id: UUID,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     """Get full portal token status for an intern — for HR dashboard display."""
# #     from app.core.security import decode_portal_token
# #     from jose import jwt, JWTError
# #     from app.core.config import settings

# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")

# #     # Check JWT expiry without raising exception
# #     token_expired = False
# #     token_expires_at = None
# #     if record.portal_token:
# #         try:
# #             payload = jwt.decode(
# #                 record.portal_token,
# #                 settings.SECRET_KEY,
# #                 algorithms=[settings.ALGORITHM]
# #             )
# #             import datetime as dt
# #             token_expires_at = dt.datetime.utcfromtimestamp(payload.get("exp", 0))
# #         except JWTError:
# #             token_expired = True

# #     # Determine overall status
# #     if not record.portal_token:
# #         status = "not_generated"
# #     elif record.portal_token_revoked:
# #         status = "revoked"
# #     elif token_expired:
# #         status = "expired"
# #     else:
# #         status = "active"

# #     return {
# #         "intern_id": str(record.id),
# #         "candidate_email": record.candidate_email,
# #         "portal_token_exists": bool(record.portal_token),
# #         "status": status,
# #         "sent_at": record.portal_token_sent_at,
# #         "expires_at": token_expires_at,
# #         "last_accessed": record.portal_token_last_accessed,
# #         "access_count": record.portal_token_access_count or 0,
# #         "revoked": record.portal_token_revoked or False,
# #         "revoked_at": record.portal_token_revoked_at,
# #         "portal_submitted": record.portal_submitted_at is not None,
# #         "portal_submitted_at": record.portal_submitted_at,
# #         # Full portal URL for HR to copy manually if needed
# #         "portal_url": f"{settings.FRONTEND_URL}/portal/{record.portal_token}" if record.portal_token and not record.portal_token_revoked and not token_expired else None,
# #     }


# # @router.post("/intern/{intern_id}/portal/revoke")
# # def revoke_portal_link(
# #     intern_id: UUID,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     """Revoke the candidate's portal link immediately. They will see 'revoked' message."""
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")
# #     if not record.portal_token:
# #         raise HTTPException(status_code=400, detail="No portal link exists for this intern")
# #     if record.portal_token_revoked:
# #         raise HTTPException(status_code=400, detail="Portal link is already revoked")

# #     record.portal_token_revoked = True
# #     record.portal_token_revoked_at = datetime.utcnow()
# #     record.portal_token_revoked_by = current_user.id

# #     db.commit()

# #     log_action(
# #         db, str(record.id), str(current_user.id),
# #         "PORTAL_LINK_REVOKED",
# #         entity_type="InternRecord",
# #         entity_id=str(record.id),
# #     )

# #     return {
# #         "message": f"Portal link revoked successfully. {record.candidate_email} can no longer access the portal.",
# #         "revoked_at": record.portal_token_revoked_at,
# #     }


# # @router.post("/intern/{intern_id}/portal/resend")
# # def resend_portal_link(
# #     intern_id: UUID,
# #     background_tasks: BackgroundTasks,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     """Generate a fresh portal token and resend the email to the candidate."""
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")

# #     # Generate brand new token
# #     new_token = create_portal_token(str(record.id))

# #     # Clear revocation, reset token and tracking
# #     record.portal_token = new_token
# #     record.portal_token_sent_at = datetime.utcnow()
# #     record.portal_token_revoked = False
# #     record.portal_token_revoked_at = None
# #     record.portal_token_revoked_by = None
# #     record.portal_token_last_accessed = None
# #     record.portal_token_access_count = 0

# #     db.commit()

# #     # Send new email
# #     portal_url = f"{settings.FRONTEND_URL}/portal/{new_token}"
# #     candidate_name = record.candidate.full_name if record.candidate else "Candidate"

# #     background_tasks.add_task(
# #         send_portal_link_email,
# #         to_email=record.candidate_email,
# #         candidate_name=candidate_name,
# #         portal_url=portal_url,
# #         role_title=record.role_title,
# #         location=record.location,
# #         start_date=str(record.start_date),
# #     )

# #     log_action(
# #         db, str(record.id), str(current_user.id),
# #         "PORTAL_LINK_RESENT",
# #         entity_type="InternRecord",
# #         entity_id=str(record.id),
# #     )

# #     return {
# #         "message": f"New portal link generated and sent to {record.candidate_email}",
# #         "sent_at": record.portal_token_sent_at,
# #         "portal_url": portal_url,  # For HR to copy if email fails
# #     }


# # # ── Send experience certificate to candidate ──────────────────────────────────

# # @router.post("/intern/{intern_id}/certificate/send")
# # def send_certificate_to_candidate(
# #     intern_id: UUID,
# #     background_tasks: BackgroundTasks,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),
# # ):
# #     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
# #     if not record:
# #         raise HTTPException(status_code=404, detail="Not found")
# #     if not record.experience_certificate:
# #         raise HTTPException(status_code=400, detail="Certificate not generated yet")
# #     if not record.experience_certificate.pdf_url:
# #         raise HTTPException(status_code=400, detail="Certificate PDF not available")

# #     cert = record.experience_certificate
# #     candidate_name = record.candidate.full_name if record.candidate else "Candidate"

# #     from app.services.email_service import send_certificate_email
# #     background_tasks.add_task(
# #         send_certificate_email,
# #         to_email=record.candidate_email,
# #         candidate_name=candidate_name,
# #         cert_url=f"{settings.FRONTEND_URL}{cert.pdf_url}",
# #     )

# #     cert.delivered_to_candidate = True
# #     cert.delivered_at = datetime.utcnow()
# #     db.commit()

# #     log_action(db, str(record.id), str(current_user.id), "CERTIFICATE_SENT")
# #     return {"message": f"Certificate sent to {record.candidate_email}"}

# # # ── Masters & Settings ────────────────────────────────────────────────────────

# # DEFAULT_MASTERS = {
# #     "departments": ["TRADC", "MBDD", "Manufacturing", "R&D", "Finance", "IT", "HR", "Sales", "Marketing"],
# #     "locations": ["MBDD", "TRADC"],
# #     "asset_types": ["Laptop", "Desktop", "Access Card", "Lab Equipment", "Safety Kit", "Mobile Phone"],
# #     "document_checklist": [
# #         {"key": "id_proof",         "label": "ID Proof",                    "required": True},
# #         {"key": "pan_card",         "label": "PAN Card",                    "required": True},
# #         {"key": "aadhaar",          "label": "Aadhaar Card",               "required": True},
# #         {"key": "cancelled_cheque", "label": "Cancelled Cheque / Passbook", "required": True},
# #         {"key": "noc",              "label": "NOC from College",            "required": False},
# #         {"key": "joining_letter",   "label": "College Joining Letter",      "required": False},
# #     ],
# #     "stipend_templates": [
# #         {"label": "Standard Intern",    "amount": 7000},
# #         {"label": "IIT/IIM Intern",     "amount": 15000},
# #         {"label": "PhD Scholar",        "amount": 25000},
# #         {"label": "Management Trainee", "amount": 20000},
# #     ],
# #     "letter_formats": [
# #         {"department": "TRADC", "header": "Grasim Industries Ltd. — TRADC Division", "signatory": "Head - Human Resources, TRADC", "footer": "TRADC, Nagda, Madhya Pradesh"},
# #         {"department": "MBDD",  "header": "Grasim Industries Ltd. — MBDD Division",  "signatory": "Head - Human Resources, MBDD",  "footer": "Aditya Birla Centre, Worli, Mumbai 400 030"},
# #     ],
# # }


# # def _get_or_create_masters(db: Session) -> MasterData:
# #     """Get masters row or create with defaults if not exists."""
# #     masters = db.query(MasterData).filter(MasterData.id == 1).first()
# #     if not masters:
# #         masters = MasterData(
# #             id=1,
# #             **DEFAULT_MASTERS
# #         )
# #         db.add(masters)
# #         db.commit()
# #         db.refresh(masters)
# #     return masters


# # @router.get("/masters")
# # def get_masters(
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(get_current_user),  # All roles can read
# # ):
# #     """Get all masters data — accessible by all roles."""
# #     masters = _get_or_create_masters(db)
# #     return {
# #         "departments": masters.departments or DEFAULT_MASTERS["departments"],
# #         "locations": masters.locations or DEFAULT_MASTERS["locations"],
# #         "asset_types": masters.asset_types or DEFAULT_MASTERS["asset_types"],
# #         "document_checklist": masters.document_checklist or DEFAULT_MASTERS["document_checklist"],
# #         "stipend_templates": masters.stipend_templates or DEFAULT_MASTERS["stipend_templates"],
# #         "letter_formats": masters.letter_formats or DEFAULT_MASTERS["letter_formats"],
# #         "updated_at": masters.updated_at,
# #     }


# # @router.put("/masters")
# # def save_masters(
# #     payload: dict,
# #     db: Session = Depends(get_db),
# #     current_user: HRUser = Depends(require_hr),  # Only HR can write
# # ):
# #     """Save all masters data — HR only."""
# #     masters = _get_or_create_masters(db)

# #     # Validate and update each field
# #     if "departments" in payload:
# #         masters.departments = [str(d).strip() for d in payload["departments"] if str(d).strip()]
# #     if "locations" in payload:
# #         masters.locations = [str(l).strip() for l in payload["locations"] if str(l).strip()]
# #     if "asset_types" in payload:
# #         masters.asset_types = [str(a).strip() for a in payload["asset_types"] if str(a).strip()]
# #     if "document_checklist" in payload:
# #         masters.document_checklist = [
# #             {"key": d["key"], "label": d["label"], "required": bool(d.get("required", False))}
# #             for d in payload["document_checklist"] if d.get("key") and d.get("label")
# #         ]
# #     if "stipend_templates" in payload:
# #         masters.stipend_templates = [
# #             {"label": t["label"], "amount": int(t["amount"])}
# #             for t in payload["stipend_templates"] if t.get("label") and t.get("amount")
# #         ]
# #     if "letter_formats" in payload:
# #         masters.letter_formats = [
# #             {
# #                 "department": f["department"],
# #                 "header": f.get("header", ""),
# #                 "signatory": f.get("signatory", ""),
# #                 "footer": f.get("footer", ""),
# #             }
# #             for f in payload["letter_formats"] if f.get("department")
# #         ]

# #     masters.updated_at = datetime.utcnow()
# #     masters.updated_by = current_user.id

# #     db.commit()
# #     db.refresh(masters)

# #     return {"message": "Masters saved successfully", "updated_at": masters.updated_at}
# from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Body
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from typing import List, Optional
# from uuid import UUID
# from datetime import datetime, date
# import math

# from app.core.database import get_db
# from app.core.security import require_hr, get_current_user, create_portal_token
# from app.models.models import (
#     HRUser, InternRecord, Candidate, Document, OfferLetter,
#     AccountsTask, ITTask, ManagerReview, InternStatus, DocStatus, TaskStatus, MasterData
# )
# from app.schemas.schemas import (
#     InternInitiateRequest, InternRecordOut, InternListItem,
#     DocumentOut, DocVerifyRequest, DashboardStats, StatusUpdateRequest,
#     OfferLetterOut, CertificateIn, CertificateOut
# )
# from app.services.email_service import send_portal_link_email
# from app.services.pdf_service import generate_offer_letter_pdf, generate_certificate_pdf
# from app.services.audit_service import log_action
# from app.services.file_service import save_upload
# from app.core.config import settings

# router = APIRouter(prefix="/hr", tags=["HR"])


# # ── Dashboard ─────────────────────────────────────────────────────────────────

# @router.get("/dashboard", response_model=DashboardStats)
# def get_dashboard(
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     total = db.query(InternRecord).count()
#     active = db.query(InternRecord).filter(InternRecord.status == InternStatus.active).count()
#     pending_docs = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.docs_under_review
#     ).count()
#     pending_offer = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.offer_sent
#     ).count()
#     pending_review = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.review_pending
#     ).count()
#     certs_issued = db.query(InternRecord).filter(
#         InternRecord.experience_certificate_issued == True
#     ).count()
#     completed = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.completed
#     ).count()
#     completion_rate = round((completed / total * 100) if total > 0 else 0, 1)

#     return DashboardStats(
#         total_interns=total,
#         active_interns=active,
#         pending_docs_verification=pending_docs,
#         pending_offer_response=pending_offer,
#         pending_manager_review=pending_review,
#         certificates_issued=certs_issued,
#         completion_rate=completion_rate,
#     )


# # ── List all interns ──────────────────────────────────────────────────────────

# @router.get("/interns", response_model=List[InternListItem])
# def list_interns(
#     status: Optional[str] = None,
#     department: Optional[str] = None,
#     location: Optional[str] = None,
#     search: Optional[str] = None,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     query = db.query(InternRecord)

#     if status:
#         query = query.filter(InternRecord.status == status)
#     if department:
#         query = query.filter(InternRecord.department == department)
#     if location:
#         query = query.filter(InternRecord.location == location)
#     if search:
#         query = query.join(Candidate, isouter=True).filter(
#             (InternRecord.candidate_email.ilike(f"%{search}%")) |
#             (Candidate.full_name.ilike(f"%{search}%")) |
#             (Candidate.institute_name.ilike(f"%{search}%"))
#         )

#     records = query.order_by(InternRecord.created_at.desc()).all()

#     result = []
#     for r in records:
#         item = InternListItem(
#             id=r.id,
#             serial_no=r.serial_no,
#             candidate_email=r.candidate_email,
#             role_title=r.role_title,
#             department=r.department,
#             location=r.location,
#             start_date=r.start_date,
#             end_date=r.end_date,
#             stipend_amount=r.stipend_amount,
#             status=r.status,
#             experience_certificate_issued=r.experience_certificate_issued,
#             candidate_name=r.candidate.full_name if r.candidate else None,
#             institute_name=r.candidate.institute_name if r.candidate else None,
#         )
#         result.append(item)
#     return result


# # ── Initiate new intern ───────────────────────────────────────────────────────

# @router.post("/initiate", response_model=InternRecordOut)
# def initiate_intern(
#     payload: InternInitiateRequest,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     # Calculate duration in weeks
#     delta = payload.end_date - payload.start_date
#     duration_weeks = math.ceil(delta.days / 7)

#     # Generate portal token
#     portal_token = create_portal_token("temp")  # will update after record creation

#     record = InternRecord(
#         initiated_by=current_user.id,
#         candidate_email=str(payload.candidate_email),
#         role_title=payload.role_title,
#         department=payload.department,
#         location=payload.location,
#         source=payload.source,
#         start_date=payload.start_date,
#         end_date=payload.end_date,
#         duration_weeks=duration_weeks,
#         stipend_amount=payload.stipend_amount,
#         reporting_manager_id=payload.reporting_manager_id,
#         laptop_required=payload.laptop_required,
#         corporate_email_required=payload.corporate_email_required,
#         other_assets=payload.other_assets,
#         notes_for_accounts=payload.notes_for_accounts,
#         review_due_date=payload.review_due_date,
#         status=InternStatus.initiated,
#     )
#     db.add(record)
#     db.commit()
#     db.refresh(record)

#     # Create real portal token with actual record id
#     real_token = create_portal_token(str(record.id))
#     record.portal_token = real_token
#     record.portal_token_sent_at = datetime.utcnow()
#     record.status = InternStatus.portal_pending

#     # Create empty candidate record
#     candidate = Candidate(intern_record_id=record.id)
#     db.add(candidate)

#     # Create accounts task (if stipend info present)
#     accounts_task = AccountsTask(
#         intern_record_id=record.id,
#         task_status=TaskStatus.pending,
#     )
#     db.add(accounts_task)

#     # Create IT task if assets needed
#     it_task = ITTask(
#         intern_record_id=record.id,
#         laptop_required=payload.laptop_required,
#         email_required=payload.corporate_email_required,
#         other_assets=payload.other_assets,
#         task_status=TaskStatus.pending,
#     )
#     db.add(it_task)

#     db.commit()
#     db.refresh(record)

#     # Send portal link email in background
#     portal_url = f"{settings.FRONTEND_URL}/portal/{real_token}"
#     background_tasks.add_task(
#         send_portal_link_email,
#         to_email=str(payload.candidate_email),
#         candidate_name="Candidate",
#         portal_url=portal_url,
#         role_title=payload.role_title,
#         location=payload.location,
#         start_date=str(payload.start_date),
#     )

#     log_action(db, str(record.id), str(current_user.id), "INTERN_INITIATED",
#                entity_type="InternRecord", entity_id=str(record.id))

#     return record


# # ── Get single intern detail ──────────────────────────────────────────────────

# @router.get("/intern/{intern_id}", response_model=InternRecordOut)
# def get_intern(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Intern record not found")
#     return record


# # ── Get intern documents ──────────────────────────────────────────────────────

# @router.get("/intern/{intern_id}/documents", response_model=List[DocumentOut])
# def get_intern_documents(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record or not record.candidate:
#         raise HTTPException(status_code=404, detail="Not found")
#     return record.candidate.documents


# # ── Verify / reject a document ────────────────────────────────────────────────

# @router.patch("/document/{doc_id}/verify", response_model=DocumentOut)
# def verify_document(
#     doc_id: UUID,
#     payload: DocVerifyRequest,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     doc = db.query(Document).filter(Document.id == doc_id).first()
#     if not doc:
#         raise HTTPException(status_code=404, detail="Document not found")

#     doc.status = payload.status
#     doc.rejection_reason = payload.rejection_reason
#     doc.verified_by_id = current_user.id
#     doc.verified_at = datetime.utcnow()

#     # If all docs approved → update intern status
#     candidate = doc.candidate
#     all_docs = candidate.documents
#     if all(d.status == DocStatus.approved for d in all_docs) and len(all_docs) > 0:
#         candidate.intern_record.status = InternStatus.docs_approved

#     db.commit()
#     db.refresh(doc)
#     return doc


# # ── Generate offer letter PDF ─────────────────────────────────────────────────

# @router.post("/intern/{intern_id}/offer-letter/generate", response_model=OfferLetterOut)
# async def generate_offer(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     pdf_url = await generate_offer_letter_pdf(record)

#     offer = record.offer_letter
#     if not offer:
#         offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
#         db.add(offer)

#     offer.pdf_url = pdf_url
#     offer.is_hr_uploaded = False
#     from app.models.models import OfferStatus
#     offer.status = OfferStatus.draft
#     offer.generated_by = current_user.id

#     db.commit()
#     db.refresh(offer)
#     return offer


# # ── HR uploads offer letter manually (override) ───────────────────────────────

# @router.post("/intern/{intern_id}/offer-letter/upload", response_model=OfferLetterOut)
# async def upload_offer(
#     intern_id: UUID,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     file_url = await save_upload(file, folder="offer_letters")

#     offer = record.offer_letter
#     if not offer:
#         offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
#         db.add(offer)

#     offer.pdf_url = file_url
#     offer.is_hr_uploaded = True
#     db.commit()
#     db.refresh(offer)
#     return offer


# # ── Send offer letter to candidate ────────────────────────────────────────────

# @router.post("/intern/{intern_id}/offer-letter/send")
# def send_offer(
#     intern_id: UUID,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record or not record.offer_letter:
#         raise HTTPException(status_code=404, detail="Offer letter not generated yet")

#     from app.models.models import OfferStatus
#     record.offer_letter.status = OfferStatus.sent
#     record.offer_letter.sent_at = datetime.utcnow()
#     record.status = InternStatus.offer_sent

#     db.commit()

#     from app.services.email_service import send_offer_email
#     portal_url = f"{settings.FRONTEND_URL}/portal/{record.portal_token}"
#     background_tasks.add_task(
#         send_offer_email,
#         to_email=record.candidate_email,
#         candidate_name=record.candidate.full_name if record.candidate else "Candidate",
#         portal_url=portal_url,
#         offer_pdf_url=record.offer_letter.pdf_url,
#     )
#     return {"message": "Offer letter sent successfully"}


# # ── Generate experience certificate ──────────────────────────────────────────

# @router.post("/intern/{intern_id}/certificate/generate", response_model=CertificateOut)
# async def generate_certificate(
#     intern_id: UUID,
#     payload: CertificateIn,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     from app.models.models import ExperienceCertificate
#     pdf_url = await generate_certificate_pdf(record, payload)

#     cert = record.experience_certificate
#     if not cert:
#         cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
#         db.add(cert)

#     cert.pdf_url = pdf_url
#     cert.project_title = payload.project_title
#     cert.guide_names = payload.guide_names
#     cert.conduct_remark = payload.conduct_remark
#     cert.issue_date = payload.issue_date
#     cert.is_hr_uploaded = False
#     cert.issued_by = current_user.id

#     record.experience_certificate_issued = True
#     record.status = InternStatus.completed

#     db.commit()
#     db.refresh(cert)
#     return cert


# # ── Upload certificate manually (override) ────────────────────────────────────

# @router.post("/intern/{intern_id}/certificate/upload", response_model=CertificateOut)
# async def upload_certificate(
#     intern_id: UUID,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     file_url = await save_upload(file, folder="certificates")

#     from app.models.models import ExperienceCertificate
#     cert = record.experience_certificate
#     if not cert:
#         cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
#         db.add(cert)

#     cert.pdf_url = file_url
#     cert.is_hr_uploaded = True
#     record.experience_certificate_issued = True

#     db.commit()
#     db.refresh(cert)
#     return cert


# # ── Export FY tracker as Excel ────────────────────────────────────────────────

# @router.get("/export/excel")
# def export_excel(
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     from app.services.excel_service import generate_fy_tracker_excel
#     from fastapi.responses import StreamingResponse
#     import io

#     output = generate_fy_tracker_excel(db)
#     return StreamingResponse(
#         io.BytesIO(output),
#         media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#         headers={"Content-Disposition": "attachment; filename=FY_Intern_Tracker.xlsx"},
#     )


# # ── HR view of Accounts task for an intern ───────────────────────────────────

# @router.get("/intern/{intern_id}/accounts-task")
# def get_accounts_task_for_hr(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """HR read-only view of accounts task for an intern."""
#     from app.models.models import AccountsTask
#     from app.api.operations import _build_accounts_task
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.accounts_task:
#         return None
#     return _build_accounts_task(record.accounts_task)


# # ── HR view of IT task for an intern ──────────────────────────────────────────

# @router.get("/intern/{intern_id}/it-task")
# def get_it_task_for_hr(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """HR read-only view of IT task for an intern."""
#     from app.models.models import ITTask
#     from app.api.operations import _build_it_task
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.it_task:
#         return None
#     return _build_it_task(record.it_task)


# # ── Update intern status manually ─────────────────────────────────────────────

# @router.patch("/intern/{intern_id}/status")
# def update_status(
#     intern_id: UUID,
#     payload: StatusUpdateRequest,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     old_status = record.status
#     record.status = payload.status
#     db.commit()

#     log_action(db, str(record.id), str(current_user.id), "STATUS_CHANGED",
#                field_changed="status", old_value=str(old_status), new_value=str(payload.status))
#     return {"message": "Status updated"}


# # ── Portal link management ────────────────────────────────────────────────────

# @router.get("/intern/{intern_id}/portal-status")
# def get_portal_status(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """Get full portal token status for an intern — for HR dashboard display."""
#     from app.core.security import decode_portal_token
#     from jose import jwt, JWTError
#     from app.core.config import settings

#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     # Check JWT expiry without raising exception
#     token_expired = False
#     token_expires_at = None
#     if record.portal_token:
#         try:
#             payload = jwt.decode(
#                 record.portal_token,
#                 settings.SECRET_KEY,
#                 algorithms=[settings.ALGORITHM]
#             )
#             import datetime as dt
#             token_expires_at = dt.datetime.utcfromtimestamp(payload.get("exp", 0))
#         except JWTError:
#             token_expired = True

#     # Determine overall status
#     if not record.portal_token:
#         status = "not_generated"
#     elif record.portal_token_revoked:
#         status = "revoked"
#     elif token_expired:
#         status = "expired"
#     else:
#         status = "active"

#     return {
#         "intern_id": str(record.id),
#         "candidate_email": record.candidate_email,
#         "portal_token_exists": bool(record.portal_token),
#         "status": status,
#         "sent_at": record.portal_token_sent_at,
#         "expires_at": token_expires_at,
#         "last_accessed": record.portal_token_last_accessed,
#         "access_count": record.portal_token_access_count or 0,
#         "revoked": record.portal_token_revoked or False,
#         "revoked_at": record.portal_token_revoked_at,
#         "portal_submitted": record.portal_submitted_at is not None,
#         "portal_submitted_at": record.portal_submitted_at,
#         # Full portal URL for HR to copy manually if needed
#         "portal_url": f"{settings.FRONTEND_URL}/portal/{record.portal_token}" if record.portal_token and not record.portal_token_revoked and not token_expired else None,
#     }


# @router.post("/intern/{intern_id}/portal/revoke")
# def revoke_portal_link(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """Revoke the candidate's portal link immediately. They will see 'revoked' message."""
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.portal_token:
#         raise HTTPException(status_code=400, detail="No portal link exists for this intern")
#     if record.portal_token_revoked:
#         raise HTTPException(status_code=400, detail="Portal link is already revoked")

#     record.portal_token_revoked = True
#     record.portal_token_revoked_at = datetime.utcnow()
#     record.portal_token_revoked_by = current_user.id

#     db.commit()

#     log_action(
#         db, str(record.id), str(current_user.id),
#         "PORTAL_LINK_REVOKED",
#         entity_type="InternRecord",
#         entity_id=str(record.id),
#     )

#     return {
#         "message": f"Portal link revoked successfully. {record.candidate_email} can no longer access the portal.",
#         "revoked_at": record.portal_token_revoked_at,
#     }


# @router.post("/intern/{intern_id}/portal/resend")
# def resend_portal_link(
#     intern_id: UUID,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """Generate a fresh portal token and resend the email to the candidate."""
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     # Generate brand new token
#     new_token = create_portal_token(str(record.id))

#     # Clear revocation, reset token and tracking
#     record.portal_token = new_token
#     record.portal_token_sent_at = datetime.utcnow()
#     record.portal_token_revoked = False
#     record.portal_token_revoked_at = None
#     record.portal_token_revoked_by = None
#     record.portal_token_last_accessed = None
#     record.portal_token_access_count = 0

#     db.commit()

#     # Send new email
#     portal_url = f"{settings.FRONTEND_URL}/portal/{new_token}"
#     candidate_name = record.candidate.full_name if record.candidate else "Candidate"

#     background_tasks.add_task(
#         send_portal_link_email,
#         to_email=record.candidate_email,
#         candidate_name=candidate_name,
#         portal_url=portal_url,
#         role_title=record.role_title,
#         location=record.location,
#         start_date=str(record.start_date),
#     )

#     log_action(
#         db, str(record.id), str(current_user.id),
#         "PORTAL_LINK_RESENT",
#         entity_type="InternRecord",
#         entity_id=str(record.id),
#     )

#     return {
#         "message": f"New portal link generated and sent to {record.candidate_email}",
#         "sent_at": record.portal_token_sent_at,
#         "portal_url": portal_url,  # For HR to copy if email fails
#     }


# # ── Send experience certificate to candidate ──────────────────────────────────

# @router.post("/intern/{intern_id}/certificate/send")
# def send_certificate_to_candidate(
#     intern_id: UUID,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.experience_certificate:
#         raise HTTPException(status_code=400, detail="Certificate not generated yet")
#     if not record.experience_certificate.pdf_url:
#         raise HTTPException(status_code=400, detail="Certificate PDF not available")

#     cert = record.experience_certificate
#     candidate_name = record.candidate.full_name if record.candidate else "Candidate"

#     from app.services.email_service import send_certificate_email
#     background_tasks.add_task(
#         send_certificate_email,
#         to_email=record.candidate_email,
#         candidate_name=candidate_name,
#         cert_url=f"{settings.FRONTEND_URL}{cert.pdf_url}",
#     )

#     cert.delivered_to_candidate = True
#     cert.delivered_at = datetime.utcnow()
#     db.commit()

#     log_action(db, str(record.id), str(current_user.id), "CERTIFICATE_SENT")
#     return {"message": f"Certificate sent to {record.candidate_email}"}

# # ── Masters & Settings ────────────────────────────────────────────────────────

# DEFAULT_MASTERS = {
#     "departments": ["TRADC", "MBDD", "Manufacturing", "R&D", "Finance", "IT", "HR", "Sales", "Marketing"],
#     "locations": ["MBDD", "TRADC"],
#     "asset_types": ["Laptop", "Desktop", "Access Card", "Lab Equipment", "Safety Kit", "Mobile Phone"],
#     "document_checklist": [
#         {"key": "id_proof",         "label": "ID Proof",                    "required": True},
#         {"key": "pan_card",         "label": "PAN Card",                    "required": True},
#         {"key": "aadhaar",          "label": "Aadhaar Card",               "required": True},
#         {"key": "cancelled_cheque", "label": "Cancelled Cheque / Passbook", "required": True},
#         {"key": "noc",              "label": "NOC from College",            "required": False},
#         {"key": "joining_letter",   "label": "College Joining Letter",      "required": False},
#     ],
#     "stipend_templates": [
#         {"label": "Standard Intern",    "amount": 7000},
#         {"label": "IIT/IIM Intern",     "amount": 15000},
#         {"label": "PhD Scholar",        "amount": 25000},
#         {"label": "Management Trainee", "amount": 20000},
#     ],
#     "letter_formats": [
#         {"department": "TRADC", "header": "Grasim Industries Ltd. — TRADC Division", "signatory": "Head - Human Resources, TRADC", "footer": "TRADC, Nagda, Madhya Pradesh"},
#         {"department": "MBDD",  "header": "Grasim Industries Ltd. — MBDD Division",  "signatory": "Head - Human Resources, MBDD",  "footer": "Aditya Birla Centre, Worli, Mumbai 400 030"},
#     ],
# }


# def _get_or_create_masters(db: Session) -> MasterData:
#     """Get masters row or create with defaults if not exists."""
#     masters = db.query(MasterData).filter(MasterData.id == 1).first()
#     if not masters:
#         masters = MasterData(
#             id=1,
#             **DEFAULT_MASTERS
#         )
#         db.add(masters)
#         db.commit()
#         db.refresh(masters)
#     return masters


# @router.get("/masters")
# def get_masters(
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(get_current_user),  # All roles can read
# ):
#     """Get all masters data — accessible by all roles."""
#     masters = _get_or_create_masters(db)
#     return {
#         "departments": masters.departments or DEFAULT_MASTERS["departments"],
#         "locations": masters.locations or DEFAULT_MASTERS["locations"],
#         "asset_types": masters.asset_types or DEFAULT_MASTERS["asset_types"],
#         "document_checklist": masters.document_checklist or DEFAULT_MASTERS["document_checklist"],
#         "stipend_templates": masters.stipend_templates or DEFAULT_MASTERS["stipend_templates"],
#         "letter_formats": masters.letter_formats or DEFAULT_MASTERS["letter_formats"],
#         "updated_at": masters.updated_at,
#     }


# @router.put("/masters")
# def save_masters(
#     payload: dict,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),  # Only HR can write
# ):
#     """Save all masters data — HR only."""
#     masters = _get_or_create_masters(db)

#     # Validate and update each field
#     if "departments" in payload:
#         masters.departments = [str(d).strip() for d in payload["departments"] if str(d).strip()]
#     if "locations" in payload:
#         masters.locations = [str(l).strip() for l in payload["locations"] if str(l).strip()]
#     if "asset_types" in payload:
#         masters.asset_types = [str(a).strip() for a in payload["asset_types"] if str(a).strip()]
#     if "document_checklist" in payload:
#         masters.document_checklist = [
#             {"key": d["key"], "label": d["label"], "required": bool(d.get("required", False))}
#             for d in payload["document_checklist"] if d.get("key") and d.get("label")
#         ]
#     if "stipend_templates" in payload:
#         masters.stipend_templates = [
#             {"label": t["label"], "amount": int(t["amount"])}
#             for t in payload["stipend_templates"] if t.get("label") and t.get("amount")
#         ]
#     if "letter_formats" in payload:
#         masters.letter_formats = [
#             {
#                 "department": f["department"],
#                 "header": f.get("header", ""),
#                 "signatory": f.get("signatory", ""),
#                 "footer": f.get("footer", ""),
#             }
#             for f in payload["letter_formats"] if f.get("department")
#         ]

#     masters.updated_at = datetime.utcnow()
#     masters.updated_by = current_user.id

#     db.commit()
#     db.refresh(masters)

#     return {"message": "Masters saved successfully", "updated_at": masters.updated_at}


# # ── Granular Masters Endpoints (per-section) ──────────────────────────────────

# @router.patch("/masters/departments")
# def update_departments(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     masters = _get_or_create_masters(db)
#     masters.departments = [str(d).strip() for d in payload.get("departments", []) if str(d).strip()]
#     masters.updated_at = datetime.utcnow()
#     db.commit()
#     return {"departments": masters.departments}

# @router.patch("/masters/locations")
# def update_locations(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     masters = _get_or_create_masters(db)
#     masters.locations = [str(l).strip() for l in payload.get("locations", []) if str(l).strip()]
#     masters.updated_at = datetime.utcnow()
#     db.commit()
#     return {"locations": masters.locations}

# @router.patch("/masters/asset-types")
# def update_asset_types(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     masters = _get_or_create_masters(db)
#     masters.asset_types = [str(a).strip() for a in payload.get("asset_types", []) if str(a).strip()]
#     masters.updated_at = datetime.utcnow()
#     db.commit()
#     return {"asset_types": masters.asset_types}

# @router.patch("/masters/document-checklist")
# def update_document_checklist(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     masters = _get_or_create_masters(db)
#     masters.document_checklist = [
#         {"key": d["key"], "label": d["label"], "required": bool(d.get("required", False))}
#         for d in payload.get("document_checklist", []) if d.get("key") and d.get("label")
#     ]
#     masters.updated_at = datetime.utcnow()
#     db.commit()
#     return {"document_checklist": masters.document_checklist}

# @router.patch("/masters/stipend-templates")
# def update_stipend_templates(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     masters = _get_or_create_masters(db)
#     masters.stipend_templates = [
#         {"label": t["label"], "amount": int(t["amount"])}
#         for t in payload.get("stipend_templates", []) if t.get("label") and t.get("amount")
#     ]
#     masters.updated_at = datetime.utcnow()
#     db.commit()
#     return {"stipend_templates": masters.stipend_templates}

# @router.patch("/masters/letter-formats")
# def update_letter_formats(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     masters = _get_or_create_masters(db)
#     masters.letter_formats = [
#         {"department": f["department"], "header": f.get("header",""), "signatory": f.get("signatory",""), "footer": f.get("footer","")}
#         for f in payload.get("letter_formats", []) if f.get("department")
#     ]
#     masters.updated_at = datetime.utcnow()
#     db.commit()
#     return {"letter_formats": masters.letter_formats}

# # ── Manager Management (HR only) ──────────────────────────────────────────────

# @router.get("/managers")
# def list_managers(db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     """List all managers."""
#     return db.query(HRUser).filter(HRUser.role == "manager", HRUser.is_active == True).all()

# @router.post("/managers")
# def create_manager(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     """Create a new manager user."""
#     if not payload.get("name") or not payload.get("email") or not payload.get("password"):
#         raise HTTPException(status_code=400, detail="name, email and password are required")
#     existing = db.query(HRUser).filter(HRUser.email == payload["email"]).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already registered")
#     user = HRUser(
#         name=payload["name"],
#         email=payload["email"],
#         password_hash=payload["password"],
#         role="manager",
#         department=payload.get("department", ""),
#         location=payload.get("location", ""),
#         is_active=True,
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user

# @router.delete("/managers/{manager_id}")
# def delete_manager(manager_id: UUID, db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     """Deactivate a manager (soft delete)."""
#     user = db.query(HRUser).filter(HRUser.id == manager_id, HRUser.role == "manager").first()
#     if not user:
#         raise HTTPException(status_code=404, detail="Manager not found")
#     user.is_active = False
#     db.commit()
#     return {"message": "Manager deactivated"}

# @router.patch("/managers/{manager_id}")
# def update_manager(manager_id: UUID, payload: dict, db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
#     """Update manager details."""
#     user = db.query(HRUser).filter(HRUser.id == manager_id, HRUser.role == "manager").first()
#     if not user:
#         raise HTTPException(status_code=404, detail="Manager not found")
#     if payload.get("name"):
#         user.name = payload["name"]
#     if payload.get("email"):
#         existing = db.query(HRUser).filter(HRUser.email == payload["email"], HRUser.id != manager_id).first()
#         if existing:
#             raise HTTPException(status_code=400, detail="Email already in use")
#         user.email = payload["email"]
#     if payload.get("password"):
#         user.password_hash = payload["password"]
#     if payload.get("department") is not None:
#         user.department = payload["department"]
#     if payload.get("location") is not None:
#         user.location = payload["location"]
#     db.commit()
#     db.refresh(user)
#     return user









# from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from typing import List, Optional
# from uuid import UUID
# from datetime import datetime, date
# import math

# from app.core.database import get_db
# from app.core.security import require_hr, get_current_user, create_portal_token
# from app.models.models import (
#     HRUser, InternRecord, Candidate, Document, OfferLetter,
#     AccountsTask, ITTask, ManagerReview, InternStatus, DocStatus, TaskStatus, MasterData
# )
# from app.schemas.schemas import (
#     InternInitiateRequest, InternRecordOut, InternListItem,
#     DocumentOut, DocVerifyRequest, DashboardStats, StatusUpdateRequest,
#     OfferLetterOut, CertificateIn, CertificateOut
# )
# from app.services.email_service import send_portal_link_email
# from app.services.pdf_service import generate_offer_letter_pdf, generate_certificate_pdf
# from app.services.audit_service import log_action
# from app.services.file_service import save_upload
# from app.core.config import settings

# router = APIRouter(prefix="/hr", tags=["HR"])


# # ── Dashboard ─────────────────────────────────────────────────────────────────

# @router.get("/dashboard", response_model=DashboardStats)
# def get_dashboard(
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     total = db.query(InternRecord).count()
#     active = db.query(InternRecord).filter(InternRecord.status == InternStatus.active).count()
#     pending_docs = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.docs_under_review
#     ).count()
#     pending_offer = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.offer_sent
#     ).count()
#     pending_review = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.review_pending
#     ).count()
#     certs_issued = db.query(InternRecord).filter(
#         InternRecord.experience_certificate_issued == True
#     ).count()
#     completed = db.query(InternRecord).filter(
#         InternRecord.status == InternStatus.completed
#     ).count()
#     completion_rate = round((completed / total * 100) if total > 0 else 0, 1)

#     return DashboardStats(
#         total_interns=total,
#         active_interns=active,
#         pending_docs_verification=pending_docs,
#         pending_offer_response=pending_offer,
#         pending_manager_review=pending_review,
#         certificates_issued=certs_issued,
#         completion_rate=completion_rate,
#     )


# # ── List all interns ──────────────────────────────────────────────────────────

# @router.get("/interns", response_model=List[InternListItem])
# def list_interns(
#     status: Optional[str] = None,
#     department: Optional[str] = None,
#     location: Optional[str] = None,
#     search: Optional[str] = None,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     query = db.query(InternRecord)

#     if status:
#         query = query.filter(InternRecord.status == status)
#     if department:
#         query = query.filter(InternRecord.department == department)
#     if location:
#         query = query.filter(InternRecord.location == location)
#     if search:
#         query = query.join(Candidate, isouter=True).filter(
#             (InternRecord.candidate_email.ilike(f"%{search}%")) |
#             (Candidate.full_name.ilike(f"%{search}%")) |
#             (Candidate.institute_name.ilike(f"%{search}%"))
#         )

#     records = query.order_by(InternRecord.created_at.desc()).all()

#     result = []
#     for r in records:
#         item = InternListItem(
#             id=r.id,
#             serial_no=r.serial_no,
#             candidate_email=r.candidate_email,
#             role_title=r.role_title,
#             department=r.department,
#             location=r.location,
#             start_date=r.start_date,
#             end_date=r.end_date,
#             stipend_amount=r.stipend_amount,
#             status=r.status,
#             experience_certificate_issued=r.experience_certificate_issued,
#             candidate_name=r.candidate.full_name if r.candidate else None,
#             institute_name=r.candidate.institute_name if r.candidate else None,
#         )
#         result.append(item)
#     return result


# # ── Initiate new intern ───────────────────────────────────────────────────────

# @router.post("/initiate", response_model=InternRecordOut)
# def initiate_intern(
#     payload: InternInitiateRequest,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     # Calculate duration in weeks
#     delta = payload.end_date - payload.start_date
#     duration_weeks = math.ceil(delta.days / 7)

#     # Generate portal token
#     portal_token = create_portal_token("temp")  # will update after record creation

#     record = InternRecord(
#         initiated_by=current_user.id,
#         candidate_email=str(payload.candidate_email),
#         role_title=payload.role_title,
#         department=payload.department,
#         location=payload.location,
#         source=payload.source,
#         start_date=payload.start_date,
#         end_date=payload.end_date,
#         duration_weeks=duration_weeks,
#         stipend_amount=payload.stipend_amount,
#         reporting_manager_id=payload.reporting_manager_id,
#         laptop_required=payload.laptop_required,
#         corporate_email_required=payload.corporate_email_required,
#         other_assets=payload.other_assets,
#         notes_for_accounts=payload.notes_for_accounts,
#         review_due_date=payload.review_due_date,
#         status=InternStatus.initiated,
#     )
#     db.add(record)
#     db.commit()
#     db.refresh(record)

#     # Create real portal token with actual record id
#     real_token = create_portal_token(str(record.id))
#     record.portal_token = real_token
#     record.portal_token_sent_at = datetime.utcnow()
#     record.status = InternStatus.portal_pending

#     # Create empty candidate record
#     candidate = Candidate(intern_record_id=record.id)
#     db.add(candidate)

#     # Create accounts task (if stipend info present)
#     accounts_task = AccountsTask(
#         intern_record_id=record.id,
#         task_status=TaskStatus.pending,
#     )
#     db.add(accounts_task)

#     # Create IT task if assets needed
#     it_task = ITTask(
#         intern_record_id=record.id,
#         laptop_required=payload.laptop_required,
#         email_required=payload.corporate_email_required,
#         other_assets=payload.other_assets,
#         task_status=TaskStatus.pending,
#     )
#     db.add(it_task)

#     db.commit()
#     db.refresh(record)

#     # Send portal link email in background
#     portal_url = f"{settings.FRONTEND_URL}/portal/{real_token}"
#     background_tasks.add_task(
#         send_portal_link_email,
#         to_email=str(payload.candidate_email),
#         candidate_name="Candidate",
#         portal_url=portal_url,
#         role_title=payload.role_title,
#         location=payload.location,
#         start_date=str(payload.start_date),
#     )

#     log_action(db, str(record.id), str(current_user.id), "INTERN_INITIATED",
#                entity_type="InternRecord", entity_id=str(record.id))

#     return record


# # ── Get single intern detail ──────────────────────────────────────────────────

# @router.get("/intern/{intern_id}", response_model=InternRecordOut)
# def get_intern(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Intern record not found")
#     return record


# # ── Get intern documents ──────────────────────────────────────────────────────

# @router.get("/intern/{intern_id}/documents", response_model=List[DocumentOut])
# def get_intern_documents(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record or not record.candidate:
#         raise HTTPException(status_code=404, detail="Not found")
#     return record.candidate.documents


# # ── Verify / reject a document ────────────────────────────────────────────────

# @router.patch("/document/{doc_id}/verify", response_model=DocumentOut)
# def verify_document(
#     doc_id: UUID,
#     payload: DocVerifyRequest,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     doc = db.query(Document).filter(Document.id == doc_id).first()
#     if not doc:
#         raise HTTPException(status_code=404, detail="Document not found")

#     doc.status = payload.status
#     doc.rejection_reason = payload.rejection_reason
#     doc.verified_by_id = current_user.id
#     doc.verified_at = datetime.utcnow()

#     # If all docs approved → update intern status
#     candidate = doc.candidate
#     all_docs = candidate.documents
#     if all(d.status == DocStatus.approved for d in all_docs) and len(all_docs) > 0:
#         candidate.intern_record.status = InternStatus.docs_approved

#     db.commit()
#     db.refresh(doc)
#     return doc


# # ── Generate offer letter PDF ─────────────────────────────────────────────────

# @router.post("/intern/{intern_id}/offer-letter/generate", response_model=OfferLetterOut)
# async def generate_offer(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     pdf_url = await generate_offer_letter_pdf(record)

#     offer = record.offer_letter
#     if not offer:
#         offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
#         db.add(offer)

#     offer.pdf_url = pdf_url
#     offer.is_hr_uploaded = False
#     from app.models.models import OfferStatus
#     offer.status = OfferStatus.draft
#     offer.generated_by = current_user.id

#     db.commit()
#     db.refresh(offer)
#     return offer


# # ── HR uploads offer letter manually (override) ───────────────────────────────

# @router.post("/intern/{intern_id}/offer-letter/upload", response_model=OfferLetterOut)
# async def upload_offer(
#     intern_id: UUID,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     file_url = await save_upload(file, folder="offer_letters")

#     offer = record.offer_letter
#     if not offer:
#         offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
#         db.add(offer)

#     offer.pdf_url = file_url
#     offer.is_hr_uploaded = True
#     db.commit()
#     db.refresh(offer)
#     return offer


# # ── Send offer letter to candidate ────────────────────────────────────────────

# @router.post("/intern/{intern_id}/offer-letter/send")
# def send_offer(
#     intern_id: UUID,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record or not record.offer_letter:
#         raise HTTPException(status_code=404, detail="Offer letter not generated yet")

#     from app.models.models import OfferStatus
#     record.offer_letter.status = OfferStatus.sent
#     record.offer_letter.sent_at = datetime.utcnow()
#     record.status = InternStatus.offer_sent

#     db.commit()

#     from app.services.email_service import send_offer_email
#     portal_url = f"{settings.FRONTEND_URL}/portal/{record.portal_token}"
#     background_tasks.add_task(
#         send_offer_email,
#         to_email=record.candidate_email,
#         candidate_name=record.candidate.full_name if record.candidate else "Candidate",
#         portal_url=portal_url,
#         offer_pdf_url=record.offer_letter.pdf_url,
#     )
#     return {"message": "Offer letter sent successfully"}


# # ── Generate experience certificate ──────────────────────────────────────────

# @router.post("/intern/{intern_id}/certificate/generate", response_model=CertificateOut)
# async def generate_certificate(
#     intern_id: UUID,
#     payload: CertificateIn,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     from app.models.models import ExperienceCertificate
#     pdf_url = await generate_certificate_pdf(record, payload)

#     cert = record.experience_certificate
#     if not cert:
#         cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
#         db.add(cert)

#     cert.pdf_url = pdf_url
#     cert.project_title = payload.project_title
#     cert.guide_names = payload.guide_names
#     cert.conduct_remark = payload.conduct_remark
#     cert.issue_date = payload.issue_date
#     cert.is_hr_uploaded = False
#     cert.issued_by = current_user.id

#     record.experience_certificate_issued = True
#     record.status = InternStatus.completed

#     db.commit()
#     db.refresh(cert)
#     return cert


# # ── Upload certificate manually (override) ────────────────────────────────────

# @router.post("/intern/{intern_id}/certificate/upload", response_model=CertificateOut)
# async def upload_certificate(
#     intern_id: UUID,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     file_url = await save_upload(file, folder="certificates")

#     from app.models.models import ExperienceCertificate
#     cert = record.experience_certificate
#     if not cert:
#         cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
#         db.add(cert)

#     cert.pdf_url = file_url
#     cert.is_hr_uploaded = True
#     record.experience_certificate_issued = True

#     db.commit()
#     db.refresh(cert)
#     return cert


# # ── Export FY tracker as Excel ────────────────────────────────────────────────

# @router.get("/export/excel")
# def export_excel(
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     from app.services.excel_service import generate_fy_tracker_excel
#     from fastapi.responses import StreamingResponse
#     import io

#     output = generate_fy_tracker_excel(db)
#     return StreamingResponse(
#         io.BytesIO(output),
#         media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#         headers={"Content-Disposition": "attachment; filename=FY_Intern_Tracker.xlsx"},
#     )


# # ── HR view of Accounts task for an intern ───────────────────────────────────

# @router.get("/intern/{intern_id}/accounts-task")
# def get_accounts_task_for_hr(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """HR read-only view of accounts task for an intern."""
#     from app.models.models import AccountsTask
#     from app.api.operations import _build_accounts_task
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.accounts_task:
#         return None
#     return _build_accounts_task(record.accounts_task)


# # ── HR view of IT task for an intern ──────────────────────────────────────────

# @router.get("/intern/{intern_id}/it-task")
# def get_it_task_for_hr(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """HR read-only view of IT task for an intern."""
#     from app.models.models import ITTask
#     from app.api.operations import _build_it_task
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.it_task:
#         return None
#     return _build_it_task(record.it_task)


# # ── Update intern status manually ─────────────────────────────────────────────

# @router.patch("/intern/{intern_id}/status")
# def update_status(
#     intern_id: UUID,
#     payload: StatusUpdateRequest,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     old_status = record.status
#     record.status = payload.status
#     db.commit()

#     log_action(db, str(record.id), str(current_user.id), "STATUS_CHANGED",
#                field_changed="status", old_value=str(old_status), new_value=str(payload.status))
#     return {"message": "Status updated"}


# # ── Portal link management ────────────────────────────────────────────────────

# @router.get("/intern/{intern_id}/portal-status")
# def get_portal_status(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """Get full portal token status for an intern — for HR dashboard display."""
#     from app.core.security import decode_portal_token
#     from jose import jwt, JWTError
#     from app.core.config import settings

#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     # Check JWT expiry without raising exception
#     token_expired = False
#     token_expires_at = None
#     if record.portal_token:
#         try:
#             payload = jwt.decode(
#                 record.portal_token,
#                 settings.SECRET_KEY,
#                 algorithms=[settings.ALGORITHM]
#             )
#             import datetime as dt
#             token_expires_at = dt.datetime.utcfromtimestamp(payload.get("exp", 0))
#         except JWTError:
#             token_expired = True

#     # Determine overall status
#     if not record.portal_token:
#         status = "not_generated"
#     elif record.portal_token_revoked:
#         status = "revoked"
#     elif token_expired:
#         status = "expired"
#     else:
#         status = "active"

#     return {
#         "intern_id": str(record.id),
#         "candidate_email": record.candidate_email,
#         "portal_token_exists": bool(record.portal_token),
#         "status": status,
#         "sent_at": record.portal_token_sent_at,
#         "expires_at": token_expires_at,
#         "last_accessed": record.portal_token_last_accessed,
#         "access_count": record.portal_token_access_count or 0,
#         "revoked": record.portal_token_revoked or False,
#         "revoked_at": record.portal_token_revoked_at,
#         "portal_submitted": record.portal_submitted_at is not None,
#         "portal_submitted_at": record.portal_submitted_at,
#         # Full portal URL for HR to copy manually if needed
#         "portal_url": f"{settings.FRONTEND_URL}/portal/{record.portal_token}" if record.portal_token and not record.portal_token_revoked and not token_expired else None,
#     }


# @router.post("/intern/{intern_id}/portal/revoke")
# def revoke_portal_link(
#     intern_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """Revoke the candidate's portal link immediately. They will see 'revoked' message."""
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.portal_token:
#         raise HTTPException(status_code=400, detail="No portal link exists for this intern")
#     if record.portal_token_revoked:
#         raise HTTPException(status_code=400, detail="Portal link is already revoked")

#     record.portal_token_revoked = True
#     record.portal_token_revoked_at = datetime.utcnow()
#     record.portal_token_revoked_by = current_user.id

#     db.commit()

#     log_action(
#         db, str(record.id), str(current_user.id),
#         "PORTAL_LINK_REVOKED",
#         entity_type="InternRecord",
#         entity_id=str(record.id),
#     )

#     return {
#         "message": f"Portal link revoked successfully. {record.candidate_email} can no longer access the portal.",
#         "revoked_at": record.portal_token_revoked_at,
#     }


# @router.post("/intern/{intern_id}/portal/resend")
# def resend_portal_link(
#     intern_id: UUID,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     """Generate a fresh portal token and resend the email to the candidate."""
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")

#     # Generate brand new token
#     new_token = create_portal_token(str(record.id))

#     # Clear revocation, reset token and tracking
#     record.portal_token = new_token
#     record.portal_token_sent_at = datetime.utcnow()
#     record.portal_token_revoked = False
#     record.portal_token_revoked_at = None
#     record.portal_token_revoked_by = None
#     record.portal_token_last_accessed = None
#     record.portal_token_access_count = 0

#     db.commit()

#     # Send new email
#     portal_url = f"{settings.FRONTEND_URL}/portal/{new_token}"
#     candidate_name = record.candidate.full_name if record.candidate else "Candidate"

#     background_tasks.add_task(
#         send_portal_link_email,
#         to_email=record.candidate_email,
#         candidate_name=candidate_name,
#         portal_url=portal_url,
#         role_title=record.role_title,
#         location=record.location,
#         start_date=str(record.start_date),
#     )

#     log_action(
#         db, str(record.id), str(current_user.id),
#         "PORTAL_LINK_RESENT",
#         entity_type="InternRecord",
#         entity_id=str(record.id),
#     )

#     return {
#         "message": f"New portal link generated and sent to {record.candidate_email}",
#         "sent_at": record.portal_token_sent_at,
#         "portal_url": portal_url,  # For HR to copy if email fails
#     }


# # ── Send experience certificate to candidate ──────────────────────────────────

# @router.post("/intern/{intern_id}/certificate/send")
# def send_certificate_to_candidate(
#     intern_id: UUID,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),
# ):
#     record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
#     if not record:
#         raise HTTPException(status_code=404, detail="Not found")
#     if not record.experience_certificate:
#         raise HTTPException(status_code=400, detail="Certificate not generated yet")
#     if not record.experience_certificate.pdf_url:
#         raise HTTPException(status_code=400, detail="Certificate PDF not available")

#     cert = record.experience_certificate
#     candidate_name = record.candidate.full_name if record.candidate else "Candidate"

#     from app.services.email_service import send_certificate_email
#     background_tasks.add_task(
#         send_certificate_email,
#         to_email=record.candidate_email,
#         candidate_name=candidate_name,
#         cert_url=f"{settings.FRONTEND_URL}{cert.pdf_url}",
#     )

#     cert.delivered_to_candidate = True
#     cert.delivered_at = datetime.utcnow()
#     db.commit()

#     log_action(db, str(record.id), str(current_user.id), "CERTIFICATE_SENT")
#     return {"message": f"Certificate sent to {record.candidate_email}"}

# # ── Masters & Settings ────────────────────────────────────────────────────────

# DEFAULT_MASTERS = {
#     "departments": ["TRADC", "MBDD", "Manufacturing", "R&D", "Finance", "IT", "HR", "Sales", "Marketing"],
#     "locations": ["MBDD", "TRADC"],
#     "asset_types": ["Laptop", "Desktop", "Access Card", "Lab Equipment", "Safety Kit", "Mobile Phone"],
#     "document_checklist": [
#         {"key": "id_proof",         "label": "ID Proof",                    "required": True},
#         {"key": "pan_card",         "label": "PAN Card",                    "required": True},
#         {"key": "aadhaar",          "label": "Aadhaar Card",               "required": True},
#         {"key": "cancelled_cheque", "label": "Cancelled Cheque / Passbook", "required": True},
#         {"key": "noc",              "label": "NOC from College",            "required": False},
#         {"key": "joining_letter",   "label": "College Joining Letter",      "required": False},
#     ],
#     "stipend_templates": [
#         {"label": "Standard Intern",    "amount": 7000},
#         {"label": "IIT/IIM Intern",     "amount": 15000},
#         {"label": "PhD Scholar",        "amount": 25000},
#         {"label": "Management Trainee", "amount": 20000},
#     ],
#     "letter_formats": [
#         {"department": "TRADC", "header": "Grasim Industries Ltd. — TRADC Division", "signatory": "Head - Human Resources, TRADC", "footer": "TRADC, Nagda, Madhya Pradesh"},
#         {"department": "MBDD",  "header": "Grasim Industries Ltd. — MBDD Division",  "signatory": "Head - Human Resources, MBDD",  "footer": "Aditya Birla Centre, Worli, Mumbai 400 030"},
#     ],
# }


# def _get_or_create_masters(db: Session) -> MasterData:
#     """Get masters row or create with defaults if not exists."""
#     masters = db.query(MasterData).filter(MasterData.id == 1).first()
#     if not masters:
#         masters = MasterData(
#             id=1,
#             **DEFAULT_MASTERS
#         )
#         db.add(masters)
#         db.commit()
#         db.refresh(masters)
#     return masters


# @router.get("/masters")
# def get_masters(
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(get_current_user),  # All roles can read
# ):
#     """Get all masters data — accessible by all roles."""
#     masters = _get_or_create_masters(db)
#     return {
#         "departments": masters.departments or DEFAULT_MASTERS["departments"],
#         "locations": masters.locations or DEFAULT_MASTERS["locations"],
#         "asset_types": masters.asset_types or DEFAULT_MASTERS["asset_types"],
#         "document_checklist": masters.document_checklist or DEFAULT_MASTERS["document_checklist"],
#         "stipend_templates": masters.stipend_templates or DEFAULT_MASTERS["stipend_templates"],
#         "letter_formats": masters.letter_formats or DEFAULT_MASTERS["letter_formats"],
#         "updated_at": masters.updated_at,
#     }


# @router.put("/masters")
# def save_masters(
#     payload: dict,
#     db: Session = Depends(get_db),
#     current_user: HRUser = Depends(require_hr),  # Only HR can write
# ):
#     """Save all masters data — HR only."""
#     masters = _get_or_create_masters(db)

#     # Validate and update each field
#     if "departments" in payload:
#         masters.departments = [str(d).strip() for d in payload["departments"] if str(d).strip()]
#     if "locations" in payload:
#         masters.locations = [str(l).strip() for l in payload["locations"] if str(l).strip()]
#     if "asset_types" in payload:
#         masters.asset_types = [str(a).strip() for a in payload["asset_types"] if str(a).strip()]
#     if "document_checklist" in payload:
#         masters.document_checklist = [
#             {"key": d["key"], "label": d["label"], "required": bool(d.get("required", False))}
#             for d in payload["document_checklist"] if d.get("key") and d.get("label")
#         ]
#     if "stipend_templates" in payload:
#         masters.stipend_templates = [
#             {"label": t["label"], "amount": int(t["amount"])}
#             for t in payload["stipend_templates"] if t.get("label") and t.get("amount")
#         ]
#     if "letter_formats" in payload:
#         masters.letter_formats = [
#             {
#                 "department": f["department"],
#                 "header": f.get("header", ""),
#                 "signatory": f.get("signatory", ""),
#                 "footer": f.get("footer", ""),
#             }
#             for f in payload["letter_formats"] if f.get("department")
#         ]

#     masters.updated_at = datetime.utcnow()
#     masters.updated_by = current_user.id

#     db.commit()
#     db.refresh(masters)

#     return {"message": "Masters saved successfully", "updated_at": masters.updated_at}
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
import math

from app.core.database import get_db
from app.core.security import require_hr, get_current_user, create_portal_token
from app.models.models import (
    HRUser, InternRecord, Candidate, Document, OfferLetter,
    AccountsTask, ITTask, ManagerReview, InternStatus, DocStatus, TaskStatus, MasterData
)
from app.schemas.schemas import (
    InternInitiateRequest, InternRecordOut, InternListItem,
    DocumentOut, DocVerifyRequest, DashboardStats, StatusUpdateRequest,
    OfferLetterOut, CertificateIn, CertificateOut
)
from app.services.email_service import send_portal_link_email
from app.services.pdf_service import generate_offer_letter_pdf, generate_certificate_pdf
from app.services.audit_service import log_action
from app.services.file_service import save_upload
from app.core.config import settings

router = APIRouter(prefix="/hr", tags=["HR"])


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    total = db.query(InternRecord).count()
    active = db.query(InternRecord).filter(InternRecord.status == InternStatus.active).count()
    pending_docs = db.query(InternRecord).filter(
        InternRecord.status == InternStatus.docs_under_review
    ).count()
    pending_offer = db.query(InternRecord).filter(
        InternRecord.status == InternStatus.offer_sent
    ).count()
    pending_review = db.query(InternRecord).filter(
        InternRecord.status == InternStatus.review_pending
    ).count()
    certs_issued = db.query(InternRecord).filter(
        InternRecord.experience_certificate_issued == True
    ).count()
    completed = db.query(InternRecord).filter(
        InternRecord.status == InternStatus.completed
    ).count()
    completion_rate = round((completed / total * 100) if total > 0 else 0, 1)

    return DashboardStats(
        total_interns=total,
        active_interns=active,
        pending_docs_verification=pending_docs,
        pending_offer_response=pending_offer,
        pending_manager_review=pending_review,
        certificates_issued=certs_issued,
        completion_rate=completion_rate,
    )


# ── List all interns ──────────────────────────────────────────────────────────

@router.get("/interns", response_model=List[InternListItem])
def list_interns(
    status: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    query = db.query(InternRecord)

    if status:
        query = query.filter(InternRecord.status == status)
    if department:
        query = query.filter(InternRecord.department == department)
    if location:
        query = query.filter(InternRecord.location == location)
    if search:
        query = query.join(Candidate, isouter=True).filter(
            (InternRecord.candidate_email.ilike(f"%{search}%")) |
            (Candidate.full_name.ilike(f"%{search}%")) |
            (Candidate.institute_name.ilike(f"%{search}%"))
        )

    records = query.order_by(InternRecord.created_at.desc()).all()

    result = []
    for r in records:
        item = InternListItem(
            id=r.id,
            serial_no=r.serial_no,
            candidate_email=r.candidate_email,
            role_title=r.role_title,
            department=r.department,
            location=r.location,
            start_date=r.start_date,
            end_date=r.end_date,
            stipend_amount=r.stipend_amount,
            status=r.status,
            experience_certificate_issued=r.experience_certificate_issued,
            candidate_name=r.candidate.full_name if r.candidate else None,
            institute_name=r.candidate.institute_name if r.candidate else None,
        )
        result.append(item)
    return result


# ── Initiate new intern ───────────────────────────────────────────────────────

@router.post("/initiate", response_model=InternRecordOut)
def initiate_intern(
    payload: InternInitiateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    # Calculate duration in weeks
    delta = payload.end_date - payload.start_date
    duration_weeks = math.ceil(delta.days / 7)

    # Generate portal token
    portal_token = create_portal_token("temp")  # will update after record creation

    record = InternRecord(
        initiated_by=current_user.id,
        candidate_email=str(payload.candidate_email),
        role_title=payload.role_title,
        department=payload.department,
        location=payload.location,
        source=payload.source,
        start_date=payload.start_date,
        end_date=payload.end_date,
        duration_weeks=duration_weeks,
        stipend_amount=payload.stipend_amount,
        reporting_manager_id=payload.reporting_manager_id,
        laptop_required=payload.laptop_required,
        corporate_email_required=payload.corporate_email_required,
        other_assets=payload.other_assets,
        notes_for_accounts=payload.notes_for_accounts,
        review_due_date=payload.review_due_date,
        status=InternStatus.initiated,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Create real portal token with actual record id
    real_token = create_portal_token(str(record.id))
    record.portal_token = real_token
    record.portal_token_sent_at = datetime.utcnow()
    record.status = InternStatus.portal_pending

    # Create candidate record pre-filled with HR-supplied data (for offer letter generation)
    candidate = Candidate(
        intern_record_id=record.id,
        full_name=payload.candidate_name,
        gender=payload.candidate_gender,
        mobile=payload.candidate_mobile,
        institute_name=payload.institute_name,
        qualification=payload.qualification,
        course=payload.course,
        year_of_study=payload.year_of_study,
        graduation_year=payload.graduation_year,
        city=payload.candidate_city,
        state=payload.candidate_state,
    )
    db.add(candidate)

    # Create accounts task (if stipend info present)
    accounts_task = AccountsTask(
        intern_record_id=record.id,
        task_status=TaskStatus.pending,
    )
    db.add(accounts_task)

    # Create IT task if assets needed
    it_task = ITTask(
        intern_record_id=record.id,
        laptop_required=payload.laptop_required,
        email_required=payload.corporate_email_required,
        other_assets=payload.other_assets,
        task_status=TaskStatus.pending,
    )
    db.add(it_task)

    db.commit()
    db.refresh(record)

    # Send portal link email in background
    portal_url = f"{settings.FRONTEND_URL}/portal/{real_token}"
    background_tasks.add_task(
        send_portal_link_email,
        to_email=str(payload.candidate_email),
        candidate_name="Candidate",
        portal_url=portal_url,
        role_title=payload.role_title,
        location=payload.location,
        start_date=str(payload.start_date),
    )

    log_action(db, str(record.id), str(current_user.id), "INTERN_INITIATED",
               entity_type="InternRecord", entity_id=str(record.id))

    return record


# ── Get single intern detail ──────────────────────────────────────────────────

@router.get("/intern/{intern_id}", response_model=InternRecordOut)
def get_intern(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Intern record not found")
    return record


# ── Get intern documents ──────────────────────────────────────────────────────

@router.get("/intern/{intern_id}/documents", response_model=List[DocumentOut])
def get_intern_documents(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record or not record.candidate:
        raise HTTPException(status_code=404, detail="Not found")
    return record.candidate.documents


# ── Verify / reject a document ────────────────────────────────────────────────

@router.patch("/document/{doc_id}/verify", response_model=DocumentOut)
def verify_document(
    doc_id: UUID,
    payload: DocVerifyRequest,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = payload.status
    doc.rejection_reason = payload.rejection_reason
    doc.verified_by_id = current_user.id
    doc.verified_at = datetime.utcnow()

    # If all docs approved → update intern status
    candidate = doc.candidate
    all_docs = candidate.documents
    if all(d.status == DocStatus.approved for d in all_docs) and len(all_docs) > 0:
        candidate.intern_record.status = InternStatus.docs_approved

    db.commit()
    db.refresh(doc)
    return doc


# ── Generate offer letter PDF ─────────────────────────────────────────────────

@router.post("/intern/{intern_id}/offer-letter/generate", response_model=OfferLetterOut)
async def generate_offer(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    pdf_url = await generate_offer_letter_pdf(record)

    offer = record.offer_letter
    if not offer:
        offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
        db.add(offer)

    offer.pdf_url = pdf_url
    offer.is_hr_uploaded = False
    from app.models.models import OfferStatus
    offer.status = OfferStatus.draft
    offer.generated_by = current_user.id

    db.commit()
    db.refresh(offer)
    return offer


# ── HR uploads offer letter manually (override) ───────────────────────────────

@router.post("/intern/{intern_id}/offer-letter/upload", response_model=OfferLetterOut)
async def upload_offer(
    intern_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    file_url = await save_upload(file, folder="offer_letters")

    offer = record.offer_letter
    if not offer:
        offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
        db.add(offer)

    offer.pdf_url = file_url
    offer.is_hr_uploaded = True
    db.commit()
    db.refresh(offer)
    return offer


# ── Send offer letter to candidate ────────────────────────────────────────────

@router.post("/intern/{intern_id}/offer-letter/send")
async def send_offer(
    intern_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Intern record not found")

    from app.models.models import OfferStatus

    # Auto-generate offer letter if it doesn't exist yet
    if not record.offer_letter or not record.offer_letter.pdf_url:
        try:
            pdf_url = await generate_offer_letter_pdf(record)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate offer letter: {str(e)}")

        offer = record.offer_letter
        if not offer:
            offer = OfferLetter(intern_record_id=record.id, generated_by=current_user.id)
            db.add(offer)

        offer.pdf_url = pdf_url
        offer.is_hr_uploaded = False
        offer.status = OfferStatus.draft
        offer.generated_by = current_user.id
        db.commit()
        db.refresh(record)

    record.offer_letter.status = OfferStatus.sent
    record.offer_letter.sent_at = datetime.utcnow()
    record.status = InternStatus.offer_sent

    db.commit()

    from app.services.email_service import send_offer_email
    portal_url = f"{settings.FRONTEND_URL}/portal/{record.portal_token}"
    background_tasks.add_task(
        send_offer_email,
        to_email=record.candidate_email,
        candidate_name=record.candidate.full_name if record.candidate else "Candidate",
        portal_url=portal_url,
        offer_pdf_url=record.offer_letter.pdf_url,
    )
    return {"message": "Offer letter generated and sent successfully"}


# ── Generate experience certificate ──────────────────────────────────────────

@router.post("/intern/{intern_id}/certificate/generate", response_model=CertificateOut)
async def generate_certificate(
    intern_id: UUID,
    payload: CertificateIn,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    from app.models.models import ExperienceCertificate
    pdf_url = await generate_certificate_pdf(record, payload)

    cert = record.experience_certificate
    if not cert:
        cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
        db.add(cert)

    cert.pdf_url = pdf_url
    cert.project_title = payload.project_title
    cert.guide_names = payload.guide_names
    cert.conduct_remark = payload.conduct_remark
    cert.issue_date = payload.issue_date
    cert.is_hr_uploaded = False
    cert.issued_by = current_user.id

    record.experience_certificate_issued = True
    record.status = InternStatus.completed

    db.commit()
    db.refresh(cert)
    return cert


# ── Upload certificate manually (override) ────────────────────────────────────

@router.post("/intern/{intern_id}/certificate/upload", response_model=CertificateOut)
async def upload_certificate(
    intern_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    file_url = await save_upload(file, folder="certificates")

    from app.models.models import ExperienceCertificate
    cert = record.experience_certificate
    if not cert:
        cert = ExperienceCertificate(intern_record_id=record.id, issued_by=current_user.id)
        db.add(cert)

    cert.pdf_url = file_url
    cert.is_hr_uploaded = True
    record.experience_certificate_issued = True

    db.commit()
    db.refresh(cert)
    return cert


# ── Export FY tracker as Excel ────────────────────────────────────────────────

@router.get("/export/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    from app.services.excel_service import generate_fy_tracker_excel
    from fastapi.responses import StreamingResponse
    import io

    output = generate_fy_tracker_excel(db)
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=FY_Intern_Tracker.xlsx"},
    )


# ── HR view of Accounts task for an intern ───────────────────────────────────

@router.get("/intern/{intern_id}/accounts-task")
def get_accounts_task_for_hr(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    """HR read-only view of accounts task for an intern."""
    from app.models.models import AccountsTask
    from app.api.operations import _build_accounts_task
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    if not record.accounts_task:
        return None
    return _build_accounts_task(record.accounts_task)


# ── HR view of IT task for an intern ──────────────────────────────────────────

@router.get("/intern/{intern_id}/it-task")
def get_it_task_for_hr(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    """HR read-only view of IT task for an intern."""
    from app.models.models import ITTask
    from app.api.operations import _build_it_task
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    if not record.it_task:
        return None
    return _build_it_task(record.it_task)


# ── Update intern status manually ─────────────────────────────────────────────

@router.patch("/intern/{intern_id}/status")
def update_status(
    intern_id: UUID,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    old_status = record.status
    record.status = payload.status
    db.commit()

    log_action(db, str(record.id), str(current_user.id), "STATUS_CHANGED",
               field_changed="status", old_value=str(old_status), new_value=str(payload.status))
    return {"message": "Status updated"}


# ── Portal link management ────────────────────────────────────────────────────

@router.get("/intern/{intern_id}/portal-status")
def get_portal_status(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    """Get full portal token status for an intern — for HR dashboard display."""
    from app.core.security import decode_portal_token
    from jose import jwt, JWTError
    from app.core.config import settings

    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    # Check JWT expiry without raising exception
    token_expired = False
    token_expires_at = None
    if record.portal_token:
        try:
            payload = jwt.decode(
                record.portal_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            import datetime as dt
            token_expires_at = dt.datetime.utcfromtimestamp(payload.get("exp", 0))
        except JWTError:
            token_expired = True

    # Determine overall status
    if not record.portal_token:
        status = "not_generated"
    elif record.portal_token_revoked:
        status = "revoked"
    elif token_expired:
        status = "expired"
    else:
        status = "active"

    return {
        "intern_id": str(record.id),
        "candidate_email": record.candidate_email,
        "portal_token_exists": bool(record.portal_token),
        "status": status,
        "sent_at": record.portal_token_sent_at,
        "expires_at": token_expires_at,
        "last_accessed": record.portal_token_last_accessed,
        "access_count": record.portal_token_access_count or 0,
        "revoked": record.portal_token_revoked or False,
        "revoked_at": record.portal_token_revoked_at,
        "portal_submitted": record.portal_submitted_at is not None,
        "portal_submitted_at": record.portal_submitted_at,
        # Full portal URL for HR to copy manually if needed
        "portal_url": f"{settings.FRONTEND_URL}/portal/{record.portal_token}" if record.portal_token and not record.portal_token_revoked and not token_expired else None,
    }


@router.post("/intern/{intern_id}/portal/revoke")
def revoke_portal_link(
    intern_id: UUID,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    """Revoke the candidate's portal link immediately. They will see 'revoked' message."""
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    if not record.portal_token:
        raise HTTPException(status_code=400, detail="No portal link exists for this intern")
    if record.portal_token_revoked:
        raise HTTPException(status_code=400, detail="Portal link is already revoked")

    record.portal_token_revoked = True
    record.portal_token_revoked_at = datetime.utcnow()
    record.portal_token_revoked_by = current_user.id

    db.commit()

    log_action(
        db, str(record.id), str(current_user.id),
        "PORTAL_LINK_REVOKED",
        entity_type="InternRecord",
        entity_id=str(record.id),
    )

    return {
        "message": f"Portal link revoked successfully. {record.candidate_email} can no longer access the portal.",
        "revoked_at": record.portal_token_revoked_at,
    }


@router.post("/intern/{intern_id}/portal/resend")
def resend_portal_link(
    intern_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    """Generate a fresh portal token and resend the email to the candidate."""
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    # Generate brand new token
    new_token = create_portal_token(str(record.id))

    # Clear revocation, reset token and tracking
    record.portal_token = new_token
    record.portal_token_sent_at = datetime.utcnow()
    record.portal_token_revoked = False
    record.portal_token_revoked_at = None
    record.portal_token_revoked_by = None
    record.portal_token_last_accessed = None
    record.portal_token_access_count = 0

    db.commit()

    # Send new email
    portal_url = f"{settings.FRONTEND_URL}/portal/{new_token}"
    candidate_name = record.candidate.full_name if record.candidate else "Candidate"

    background_tasks.add_task(
        send_portal_link_email,
        to_email=record.candidate_email,
        candidate_name=candidate_name,
        portal_url=portal_url,
        role_title=record.role_title,
        location=record.location,
        start_date=str(record.start_date),
    )

    log_action(
        db, str(record.id), str(current_user.id),
        "PORTAL_LINK_RESENT",
        entity_type="InternRecord",
        entity_id=str(record.id),
    )

    return {
        "message": f"New portal link generated and sent to {record.candidate_email}",
        "sent_at": record.portal_token_sent_at,
        "portal_url": portal_url,  # For HR to copy if email fails
    }


# ── Send experience certificate to candidate ──────────────────────────────────

@router.post("/intern/{intern_id}/certificate/send")
def send_certificate_to_candidate(
    intern_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),
):
    record = db.query(InternRecord).filter(InternRecord.id == intern_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    if not record.experience_certificate:
        raise HTTPException(status_code=400, detail="Certificate not generated yet")
    if not record.experience_certificate.pdf_url:
        raise HTTPException(status_code=400, detail="Certificate PDF not available")

    cert = record.experience_certificate
    candidate_name = record.candidate.full_name if record.candidate else "Candidate"

    from app.services.email_service import send_certificate_email
    background_tasks.add_task(
        send_certificate_email,
        to_email=record.candidate_email,
        candidate_name=candidate_name,
        cert_url=f"{settings.FRONTEND_URL}{cert.pdf_url}",
    )

    cert.delivered_to_candidate = True
    cert.delivered_at = datetime.utcnow()
    db.commit()

    log_action(db, str(record.id), str(current_user.id), "CERTIFICATE_SENT")
    return {"message": f"Certificate sent to {record.candidate_email}"}

# ── Masters & Settings ────────────────────────────────────────────────────────

DEFAULT_MASTERS = {
    "departments": ["TRADC", "MBDD", "Manufacturing", "R&D", "Finance", "IT", "HR", "Sales", "Marketing"],
    "locations": ["MBDD", "TRADC"],
    "asset_types": ["Laptop", "Desktop", "Access Card", "Lab Equipment", "Safety Kit", "Mobile Phone"],
    "document_checklist": [
        {"key": "id_proof",         "label": "ID Proof",                    "required": True},
        {"key": "pan_card",         "label": "PAN Card",                    "required": True},
        {"key": "aadhaar",          "label": "Aadhaar Card",               "required": True},
        {"key": "cancelled_cheque", "label": "Cancelled Cheque / Passbook", "required": True},
        {"key": "noc",              "label": "NOC from College",            "required": False},
        {"key": "joining_letter",   "label": "College Joining Letter",      "required": False},
    ],
    "stipend_templates": [
        {"label": "Standard Intern",    "amount": 7000},
        {"label": "IIT/IIM Intern",     "amount": 15000},
        {"label": "PhD Scholar",        "amount": 25000},
        {"label": "Management Trainee", "amount": 20000},
    ],
    "letter_formats": [
        {"department": "TRADC", "header": "Grasim Industries Ltd. — TRADC Division", "signatory": "Head - Human Resources, TRADC", "footer": "TRADC, Nagda, Madhya Pradesh"},
        {"department": "MBDD",  "header": "Grasim Industries Ltd. — MBDD Division",  "signatory": "Head - Human Resources, MBDD",  "footer": "Aditya Birla Centre, Worli, Mumbai 400 030"},
    ],
}


def _get_or_create_masters(db: Session) -> MasterData:
    """Get masters row or create with defaults if not exists."""
    masters = db.query(MasterData).filter(MasterData.id == 1).first()
    if not masters:
        masters = MasterData(
            id=1,
            **DEFAULT_MASTERS
        )
        db.add(masters)
        db.commit()
        db.refresh(masters)
    return masters


@router.get("/masters")
def get_masters(
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(get_current_user),  # All roles can read
):
    """Get all masters data — accessible by all roles."""
    masters = _get_or_create_masters(db)
    return {
        "departments": masters.departments or DEFAULT_MASTERS["departments"],
        "locations": masters.locations or DEFAULT_MASTERS["locations"],
        "asset_types": masters.asset_types or DEFAULT_MASTERS["asset_types"],
        "document_checklist": masters.document_checklist or DEFAULT_MASTERS["document_checklist"],
        "stipend_templates": masters.stipend_templates or DEFAULT_MASTERS["stipend_templates"],
        "letter_formats": masters.letter_formats or DEFAULT_MASTERS["letter_formats"],
        "updated_at": masters.updated_at,
    }


@router.put("/masters")
def save_masters(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: HRUser = Depends(require_hr),  # Only HR can write
):
    """Save all masters data — HR only."""
    masters = _get_or_create_masters(db)

    # Validate and update each field
    if "departments" in payload:
        masters.departments = [str(d).strip() for d in payload["departments"] if str(d).strip()]
    if "locations" in payload:
        masters.locations = [str(l).strip() for l in payload["locations"] if str(l).strip()]
    if "asset_types" in payload:
        masters.asset_types = [str(a).strip() for a in payload["asset_types"] if str(a).strip()]
    if "document_checklist" in payload:
        masters.document_checklist = [
            {"key": d["key"], "label": d["label"], "required": bool(d.get("required", False))}
            for d in payload["document_checklist"] if d.get("key") and d.get("label")
        ]
    if "stipend_templates" in payload:
        masters.stipend_templates = [
            {"label": t["label"], "amount": int(t["amount"])}
            for t in payload["stipend_templates"] if t.get("label") and t.get("amount")
        ]
    if "letter_formats" in payload:
        masters.letter_formats = [
            {
                "department": f["department"],
                "header": f.get("header", ""),
                "signatory": f.get("signatory", ""),
                "footer": f.get("footer", ""),
            }
            for f in payload["letter_formats"] if f.get("department")
        ]

    masters.updated_at = datetime.utcnow()
    masters.updated_by = current_user.id

    db.commit()
    db.refresh(masters)

    return {"message": "Masters saved successfully", "updated_at": masters.updated_at}


# ── Granular Masters Endpoints (per-section) ──────────────────────────────────

@router.patch("/masters/departments")
def update_departments(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    masters = _get_or_create_masters(db)
    masters.departments = [str(d).strip() for d in payload.get("departments", []) if str(d).strip()]
    masters.updated_at = datetime.utcnow()
    db.commit()
    return {"departments": masters.departments}

@router.patch("/masters/locations")
def update_locations(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    masters = _get_or_create_masters(db)
    masters.locations = [str(l).strip() for l in payload.get("locations", []) if str(l).strip()]
    masters.updated_at = datetime.utcnow()
    db.commit()
    return {"locations": masters.locations}

@router.patch("/masters/asset-types")
def update_asset_types(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    masters = _get_or_create_masters(db)
    masters.asset_types = [str(a).strip() for a in payload.get("asset_types", []) if str(a).strip()]
    masters.updated_at = datetime.utcnow()
    db.commit()
    return {"asset_types": masters.asset_types}

@router.patch("/masters/document-checklist")
def update_document_checklist(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    masters = _get_or_create_masters(db)
    masters.document_checklist = [
        {"key": d["key"], "label": d["label"], "required": bool(d.get("required", False))}
        for d in payload.get("document_checklist", []) if d.get("key") and d.get("label")
    ]
    masters.updated_at = datetime.utcnow()
    db.commit()
    return {"document_checklist": masters.document_checklist}

@router.patch("/masters/stipend-templates")
def update_stipend_templates(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    masters = _get_or_create_masters(db)
    masters.stipend_templates = [
        {"label": t["label"], "amount": int(t["amount"])}
        for t in payload.get("stipend_templates", []) if t.get("label") and t.get("amount")
    ]
    masters.updated_at = datetime.utcnow()
    db.commit()
    return {"stipend_templates": masters.stipend_templates}

@router.patch("/masters/letter-formats")
def update_letter_formats(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    masters = _get_or_create_masters(db)
    masters.letter_formats = [
        {"department": f["department"], "header": f.get("header",""), "signatory": f.get("signatory",""), "footer": f.get("footer","")}
        for f in payload.get("letter_formats", []) if f.get("department")
    ]
    masters.updated_at = datetime.utcnow()
    db.commit()
    return {"letter_formats": masters.letter_formats}

# ── Manager Management (HR only) ──────────────────────────────────────────────

@router.get("/managers")
def list_managers(db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    """List all managers."""
    return db.query(HRUser).filter(HRUser.role == "manager", HRUser.is_active == True).all()

@router.post("/managers")
def create_manager(payload: dict = Body(...), db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    """Create a new manager user."""
    if not payload.get("name") or not payload.get("email") or not payload.get("password"):
        raise HTTPException(status_code=400, detail="name, email and password are required")
    existing = db.query(HRUser).filter(HRUser.email == payload["email"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = HRUser(
        name=payload["name"],
        email=payload["email"],
        password_hash=payload["password"],
        role="manager",
        department=payload.get("department", ""),
        location=payload.get("location", ""),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/managers/{manager_id}")
def delete_manager(manager_id: UUID, db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    """Deactivate a manager (soft delete)."""
    user = db.query(HRUser).filter(HRUser.id == manager_id, HRUser.role == "manager").first()
    if not user:
        raise HTTPException(status_code=404, detail="Manager not found")
    user.is_active = False
    db.commit()
    return {"message": "Manager deactivated"}

@router.patch("/managers/{manager_id}")
def update_manager(manager_id: UUID, payload: dict, db: Session = Depends(get_db), current_user: HRUser = Depends(require_hr)):
    """Update manager details."""
    user = db.query(HRUser).filter(HRUser.id == manager_id, HRUser.role == "manager").first()
    if not user:
        raise HTTPException(status_code=404, detail="Manager not found")
    if payload.get("name"):
        user.name = payload["name"]
    if payload.get("email"):
        existing = db.query(HRUser).filter(HRUser.email == payload["email"], HRUser.id != manager_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload["email"]
    if payload.get("password"):
        user.password_hash = payload["password"]
    if payload.get("department") is not None:
        user.department = payload["department"]
    if payload.get("location") is not None:
        user.location = payload["location"]
    db.commit()
    db.refresh(user)
    return user