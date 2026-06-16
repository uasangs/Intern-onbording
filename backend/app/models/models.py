import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Float,
    Integer, Text, ForeignKey, Enum as SAEnum, JSON, LargeBinary
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


# ── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    hr = "hr"
    accounts = "accounts"
    it = "it"
    manager = "manager"


class InternStatus(str, enum.Enum):
    initiated = "initiated"           # HR filled form
    portal_pending = "portal_pending" # Email sent, waiting candidate
    portal_submitted = "portal_submitted"  # Candidate filled form
    docs_under_review = "docs_under_review"
    docs_approved = "docs_approved"
    offer_sent = "offer_sent"
    offer_accepted = "offer_accepted"
    offer_declined = "offer_declined"
    active = "active"                 # Internship in progress
    review_pending = "review_pending" # Near end date
    completed = "completed"
    terminated = "terminated"


class OfferStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    accepted = "accepted"
    declined = "declined"
    clarification_requested = "clarification_requested"


class DocType(str, enum.Enum):
    id_proof = "id_proof"
    pan_card = "pan_card"
    aadhaar = "aadhaar"
    cancelled_cheque = "cancelled_cheque"
    passbook_scan = "passbook_scan"
    other = "other"


class DocStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"


class AnnexureType(str, enum.Enum):
    A = "A"
    B = "B"


class Recommendation(str, enum.Enum):
    confirm = "confirm"
    extend = "extend"
    not_confirm = "not_confirm"


# ── Models ──────────────────────────────────────────────────────────────────

class HRUser(Base):
    __tablename__ = "hr_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    department = Column(String(100))
    location = Column(String(50))  # MBDD or TRADC
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    initiated_interns = relationship(
        "InternRecord", foreign_keys="InternRecord.initiated_by", back_populates="initiator"
    )
    managed_interns = relationship(
        "InternRecord", foreign_keys="InternRecord.reporting_manager_id", back_populates="reporting_manager"
    )
    verified_docs = relationship("Document", back_populates="verifier")
    created_offers = relationship("OfferLetter", back_populates="generated_by_user")
    issued_certificates = relationship("ExperienceCertificate", back_populates="issued_by_user")
    reviews_given = relationship("ManagerReview", back_populates="manager")


class InternRecord(Base):
    __tablename__ = "intern_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    serial_no = Column(Integer, autoincrement=True, unique=True)

    # HR who created
    initiated_by = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"), nullable=False)
    reporting_manager_id = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"))

    # Candidate info (pre-filled by HR)
    candidate_email = Column(String(255), nullable=False, index=True)
    role_title = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    location = Column(String(50), nullable=False)  # MBDD or TRADC
    source = Column(String(100))  # College, referral, etc.

    # Duration
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_weeks = Column(Integer)

    # Stipend
    stipend_amount = Column(Float, default=7000.0)
    payment_frequency = Column(String(50), default="monthly")

    # Assets required
    laptop_required = Column(Boolean, default=False)
    corporate_email_required = Column(Boolean, default=False)
    other_assets = Column(Text)
    notes_for_accounts = Column(Text)

    # Review
    review_due_date = Column(Date)

    # Status
    status = Column(SAEnum(InternStatus), default=InternStatus.initiated)

    # Tracker fields (matches FY Excel tracker)
    project_submission_done = Column(Boolean, default=False)
    project_presentation_done = Column(Boolean, default=False)
    eval_from_mgr_done = Column(Boolean, default=False)
    panel_evaluation_done = Column(Boolean, default=False)
    experience_certificate_issued = Column(Boolean, default=False)

    # Portal token
    portal_token = Column(String(500), unique=True)
    portal_token_sent_at = Column(DateTime)
    portal_token_revoked = Column(Boolean, default=False)
    portal_token_revoked_at = Column(DateTime)
    portal_token_revoked_by = Column(UUID(as_uuid=True))
    portal_token_last_accessed = Column(DateTime)
    portal_token_access_count = Column(Integer, default=0)
    portal_submitted_at = Column(DateTime)
    self_review_enabled = Column(Boolean, default=False)  # HR enables intern self-review

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    initiator = relationship("HRUser", foreign_keys=[initiated_by], back_populates="initiated_interns")
    reporting_manager = relationship("HRUser", foreign_keys=[reporting_manager_id], back_populates="managed_interns")
    candidate = relationship("Candidate", back_populates="intern_record", uselist=False)
    offer_letter = relationship("OfferLetter", back_populates="intern_record", uselist=False)
    annexure_signatures = relationship("AnnexureSignature", back_populates="intern_record")
    accounts_task = relationship("AccountsTask", back_populates="intern_record", uselist=False)
    it_task = relationship("ITTask", back_populates="intern_record", uselist=False)
    abg_email_access = relationship("ABGEmailAccess", back_populates="intern_record", uselist=False)
    manager_review = relationship("ManagerReview", back_populates="intern_record", uselist=False)
    self_review = relationship("SelfReview", back_populates="intern_record", uselist=False)
    experience_certificate = relationship("ExperienceCertificate", back_populates="intern_record", uselist=False)
    notification_logs = relationship("NotificationLog", back_populates="intern_record")
    audit_logs = relationship("AuditLog", back_populates="intern_record")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)

    # Privacy policy
    privacy_accepted = Column(Boolean, default=False)
    privacy_accepted_at = Column(DateTime)

    # Personal details
    full_name = Column(String(200))
    gender = Column(String(20))
    dob = Column(Date)
    mobile = Column(String(20))
    contact_no = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))

    # Identity
    pan_card_no = Column(String(20))
    aadhaar_no = Column(String(20))

    # Academic
    institute_name = Column(String(300))
    qualification = Column(String(100))
    course = Column(String(200))
    year_of_study = Column(String(20))
    graduation_year = Column(Integer)

    # Emergency contact
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(20))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="candidate")
    bank_details = relationship("BankDetails", back_populates="candidate", uselist=False)
    documents = relationship("Document", back_populates="candidate")


class BankDetails(Base):
    __tablename__ = "bank_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), unique=True, nullable=False)

    bank_name = Column(String(200))
    account_number = Column(String(50))
    ifsc_code = Column(String(20))
    account_holder_name = Column(String(200))
    account_type = Column(String(50))  # savings / current

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="bank_details")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"))

    doc_type = Column(SAEnum(DocType), nullable=False)
    file_url = Column(String(500))
    file_name = Column(String(255))
    file_size_kb = Column(Integer)
    file_data = Column(LargeBinary)
    content_type = Column(String(100), default="application/pdf")
    status = Column(SAEnum(DocStatus), default=DocStatus.pending)
    rejection_reason = Column(Text)

    uploaded_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime)

    # Relationships
    candidate = relationship("Candidate", back_populates="documents")
    verifier = relationship("HRUser", back_populates="verified_docs")


class OfferLetter(Base):
    __tablename__ = "offer_letters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"))

    pdf_url = Column(String(500))
    file_data = Column(LargeBinary)
    file_name = Column(String(255))
    content_type = Column(String(100), default="application/pdf")
    is_hr_uploaded = Column(Boolean, default=False)
    status = Column(SAEnum(OfferStatus), default=OfferStatus.draft)

    sent_at = Column(DateTime)
    responded_at = Column(DateTime)
    candidate_response = Column(String(50))  # accepted / declined / clarification
    candidate_remarks = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="offer_letter")
    generated_by_user = relationship("HRUser", back_populates="created_offers")


class AnnexureSignature(Base):
    __tablename__ = "annexure_signatures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), nullable=False)

    annexure_type = Column(SAEnum(AnnexureType), nullable=False)  # A or B
    signed_at = Column(DateTime)
    signed_place = Column(String(200))
    university_name = Column(String(300))
    candidate_name = Column(String(200))
    pan_card_no = Column(String(20))   # Required for Annexure B
    aadhaar_no = Column(String(20))    # Required for Annexure B
    ip_address = Column(String(50))

    # Relationships
    intern_record = relationship("InternRecord", back_populates="annexure_signatures")


class AccountsTask(Base):
    __tablename__ = "accounts_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"))

    vendor_id = Column(String(100))
    payment_mode = Column(String(50))
    task_status = Column(SAEnum(TaskStatus), default=TaskStatus.pending)
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="accounts_task")
    stipend_payments = relationship("StipendPayment", back_populates="accounts_task")


class StipendPayment(Base):
    __tablename__ = "stipend_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    accounts_task_id = Column(UUID(as_uuid=True), ForeignKey("accounts_tasks.id"), nullable=False)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), nullable=False)

    payment_date = Column(Date)
    amount = Column(Float, default=7000.0)
    month_year = Column(String(20))  # e.g. "Jan 2026"
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.pending)
    utr_reference = Column(String(100))
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    accounts_task = relationship("AccountsTask", back_populates="stipend_payments")


class ITTask(Base):
    __tablename__ = "it_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"))

    laptop_required = Column(Boolean, default=False)
    laptop_serial = Column(String(100))
    laptop_provisioned = Column(Boolean, default=False)

    email_required = Column(Boolean, default=False)
    abg_email_id = Column(String(255))
    email_provisioned = Column(Boolean, default=False)

    other_assets = Column(Text)
    other_assets_provisioned = Column(Boolean, default=False)

    task_status = Column(SAEnum(TaskStatus), default=TaskStatus.pending)
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="it_task")


class ABGEmailAccess(Base):
    __tablename__ = "abg_email_access"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)

    abg_email_id = Column(String(255))
    temp_password_hash = Column(String(255))
    is_active = Column(Boolean, default=True)
    provisioned_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="abg_email_access")


class ManagerReview(Base):
    __tablename__ = "manager_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"), nullable=False)

    project_name = Column(String(500))
    guide_names = Column(String(500))

    # Ratings (1-5)
    performance_rating = Column(Integer)
    attitude_rating = Column(Integer)
    punctuality_rating = Column(Integer)
    technical_rating = Column(Integer)
    communication_rating = Column(Integer)
    overall_rating = Column(Integer)

    feedback_text = Column(Text)
    recommendation = Column(SAEnum(Recommendation))

    # Tracker fields
    eval_from_mgr = Column(Boolean, default=False)
    panel_evaluation = Column(Boolean, default=False)
    project_submission = Column(Boolean, default=False)
    project_presentation = Column(Boolean, default=False)

    submitted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="manager_review")
    manager = relationship("HRUser", back_populates="reviews_given")


class MasterData(Base):
    """Single-row JSON store for all master configuration data."""
    __tablename__ = "master_data"

    id = Column(Integer, primary_key=True, default=1)
    departments = Column(JSONB, default=list)
    locations = Column(JSONB, default=list)
    asset_types = Column(JSONB, default=list)
    document_checklist = Column(JSONB, default=list)
    stipend_templates = Column(JSONB, default=list)
    letter_formats = Column(JSONB, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"), nullable=True)


class SelfReview(Base):
    """Student self-review — submitted via candidate portal alongside manager review."""
    __tablename__ = "self_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)

    # Ratings
    overall_experience: int = Column(Integer)
    learning_rating: int = Column(Integer)
    mentorship_rating: int = Column(Integer)
    facilities_rating: int = Column(Integer)
    work_culture_rating: int = Column(Integer)

    # Text fields
    key_learnings = Column(Text)
    challenges_faced = Column(Text)
    suggestions = Column(Text)
    would_recommend = Column(Boolean, default=True)
    overall_feedback = Column(Text)

    submitted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    intern_record = relationship("InternRecord", back_populates="self_review")


class ExperienceCertificate(Base):
    __tablename__ = "experience_certificates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), unique=True, nullable=False)
    issued_by = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"))

    pdf_url = Column(String(500))
    file_data = Column(LargeBinary)
    file_name = Column(String(255))
    content_type = Column(String(100), default="application/pdf")
    is_hr_uploaded = Column(Boolean, default=False)
    project_title = Column(String(500))
    guide_names = Column(String(500))
    conduct_remark = Column(String(200), default="good")

    issue_date = Column(Date)
    delivered_to_candidate = Column(Boolean, default=False)
    delivered_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="experience_certificate")
    issued_by_user = relationship("HRUser", back_populates="issued_certificates")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"), nullable=False)

    recipient_email = Column(String(255), nullable=False)
    notification_type = Column(String(100))  # portal_link, offer_sent, docs_rejected etc.
    subject = Column(String(500))
    status = Column(String(50), default="sent")
    error_message = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="notification_logs")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_record_id = Column(UUID(as_uuid=True), ForeignKey("intern_records.id"))
    performed_by = Column(UUID(as_uuid=True), ForeignKey("hr_users.id"))

    action = Column(String(200), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(100))
    field_changed = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    ip_address = Column(String(50))
    performed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    intern_record = relationship("InternRecord", back_populates="audit_logs")