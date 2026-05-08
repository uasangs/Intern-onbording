# from pydantic import BaseModel, EmailStr, Field, validator
# from typing import Optional, List
# from datetime import date, datetime
# from uuid import UUID
# from app.models.models import (
#     UserRole, InternStatus, OfferStatus, DocType, DocStatus,
#     TaskStatus, PaymentStatus, AnnexureType, Recommendation
# )


# # ── Auth ────────────────────────────────────────────────────────────────────

# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str


# class TokenResponse(BaseModel):
#     access_token: str
#     token_type: str = "bearer"
#     role: str
#     name: str
#     user_id: str


# class UserOut(BaseModel):
#     id: UUID
#     name: str
#     email: str
#     role: UserRole
#     department: Optional[str]
#     location: Optional[str]
#     is_active: bool

#     class Config:
#         from_attributes = True


# class UserCreate(BaseModel):
#     name: str
#     email: EmailStr
#     password: str = Field(min_length=8)
#     role: UserRole
#     department: Optional[str] = None
#     location: Optional[str] = None


# # ── Intern Record ────────────────────────────────────────────────────────────

# class InternInitiateRequest(BaseModel):
#     candidate_email: EmailStr
#     role_title: str
#     department: str
#     location: str = Field(..., description="MBDD or TRADC")
#     source: Optional[str] = None
#     start_date: date
#     end_date: date
#     stipend_amount: float = 7000.0
#     reporting_manager_id: Optional[UUID] = None
#     laptop_required: bool = False
#     corporate_email_required: bool = False
#     other_assets: Optional[str] = None
#     notes_for_accounts: Optional[str] = None
#     review_due_date: Optional[date] = None


# class InternRecordOut(BaseModel):
#     id: UUID
#     serial_no: Optional[int]
#     candidate_email: str
#     role_title: str
#     department: str
#     location: str
#     source: Optional[str]
#     start_date: date
#     end_date: date
#     duration_weeks: Optional[int]
#     stipend_amount: float
#     laptop_required: bool
#     corporate_email_required: bool
#     other_assets: Optional[str]
#     notes_for_accounts: Optional[str]
#     status: InternStatus
#     review_due_date: Optional[date]
#     project_submission_done: bool
#     project_presentation_done: bool
#     eval_from_mgr_done: bool
#     panel_evaluation_done: bool
#     experience_certificate_issued: bool
#     portal_submitted_at: Optional[datetime]
#     created_at: datetime
#     updated_at: datetime
#     initiator: Optional[UserOut]
#     reporting_manager: Optional[UserOut]
#     candidate: Optional["CandidateOut"]
#     offer_letter: Optional["OfferLetterOut"] = None
#     experience_certificate: Optional["CertificateOut"] = None
#     manager_review: Optional["ManagerReviewOut"] = None
#     self_review: Optional["SelfReviewOut"] = None

#     class Config:
#         from_attributes = True


# class InternListItem(BaseModel):
#     id: UUID
#     serial_no: Optional[int]
#     candidate_email: str
#     role_title: str
#     department: str
#     location: str
#     start_date: date
#     end_date: date
#     stipend_amount: float
#     status: InternStatus
#     experience_certificate_issued: bool
#     candidate_name: Optional[str] = None
#     institute_name: Optional[str] = None

#     class Config:
#         from_attributes = True


# class StatusUpdateRequest(BaseModel):
#     status: InternStatus


# # ── Candidate ────────────────────────────────────────────────────────────────

# class CandidatePersonalIn(BaseModel):
#     full_name: str
#     gender: str
#     dob: date
#     mobile: str
#     contact_no: Optional[str] = None
#     address: str
#     city: str
#     state: str
#     pincode: str
#     pan_card_no: str
#     aadhaar_no: str
#     emergency_contact_name: str
#     emergency_contact_phone: str


# class CandidateAcademicIn(BaseModel):
#     institute_name: str
#     qualification: str
#     course: str
#     year_of_study: str
#     graduation_year: int


# class CandidateOut(BaseModel):
#     id: UUID
#     full_name: Optional[str]
#     gender: Optional[str]
#     dob: Optional[date]
#     mobile: Optional[str]
#     contact_no: Optional[str]
#     address: Optional[str]
#     city: Optional[str]
#     state: Optional[str]
#     pincode: Optional[str]
#     pan_card_no: Optional[str]
#     aadhaar_no: Optional[str]
#     institute_name: Optional[str]
#     qualification: Optional[str]
#     course: Optional[str]
#     year_of_study: Optional[str]
#     graduation_year: Optional[int]
#     emergency_contact_name: Optional[str]
#     emergency_contact_phone: Optional[str]
#     bank_details: Optional["BankDetailsOut"] = None

#     class Config:
#         from_attributes = True


# # ── Bank Details ─────────────────────────────────────────────────────────────

# class BankDetailsIn(BaseModel):
#     bank_name: str
#     account_number: str
#     ifsc_code: str
#     account_holder_name: str
#     account_type: str = "savings"


# class BankDetailsOut(BaseModel):
#     id: UUID
#     bank_name: Optional[str]
#     account_number: Optional[str]
#     ifsc_code: Optional[str]
#     account_holder_name: Optional[str]
#     account_type: Optional[str]

#     class Config:
#         from_attributes = True


# # ── Full candidate portal submission ─────────────────────────────────────────

# class CandidatePortalSubmit(BaseModel):
#     privacy_accepted: bool = False
#     personal: CandidatePersonalIn
#     academic: CandidateAcademicIn
#     bank: BankDetailsIn


# # ── Documents ────────────────────────────────────────────────────────────────

# class DocumentOut(BaseModel):
#     id: UUID
#     doc_type: DocType
#     file_name: Optional[str]
#     file_url: Optional[str]
#     file_size_kb: Optional[int]
#     status: DocStatus
#     uploaded_at: datetime

#     class Config:
#         from_attributes = True


# class DocVerifyRequest(BaseModel):
#     status: DocStatus
#     rejection_reason: Optional[str] = None


# # ── Offer Letter ─────────────────────────────────────────────────────────────

# class OfferLetterOut(BaseModel):
#     id: UUID
#     pdf_url: Optional[str]
#     is_hr_uploaded: bool
#     status: OfferStatus
#     sent_at: Optional[datetime]
#     responded_at: Optional[datetime]
#     candidate_response: Optional[str]
#     candidate_remarks: Optional[str]

#     class Config:
#         from_attributes = True


# class OfferResponseRequest(BaseModel):
#     response: str = Field(..., description="accepted | declined | clarification_requested")
#     remarks: Optional[str] = None


# # ── Annexure Signature ────────────────────────────────────────────────────────

# class AnnexureSignIn(BaseModel):
#     annexure_type: AnnexureType
#     signed_place: str
#     university_name: str
#     candidate_name: str
#     pan_card_no: Optional[str] = None   # Required for B
#     aadhaar_no: Optional[str] = None    # Required for B


# class AnnexureSignOut(BaseModel):
#     id: UUID
#     annexure_type: AnnexureType
#     signed_at: Optional[datetime]
#     signed_place: Optional[str]
#     university_name: Optional[str]

#     class Config:
#         from_attributes = True


# # ── Accounts Task ─────────────────────────────────────────────────────────────

# class AccountsInternInfo(BaseModel):
#     """Intern details embedded in accounts task response"""
#     id: UUID
#     candidate_email: str
#     role_title: str
#     department: str
#     location: str
#     start_date: date
#     end_date: date
#     duration_weeks: Optional[int]
#     stipend_amount: float
#     payment_frequency: str
#     notes_for_accounts: Optional[str]
#     candidate_name: Optional[str] = None
#     institute_name: Optional[str] = None
#     bank_name: Optional[str] = None
#     account_number: Optional[str] = None
#     ifsc_code: Optional[str] = None
#     account_holder_name: Optional[str] = None
#     account_type: Optional[str] = None

#     class Config:
#         from_attributes = True


# class AccountsTaskOut(BaseModel):
#     id: UUID
#     intern_record_id: UUID
#     vendor_id: Optional[str]
#     payment_mode: Optional[str]
#     task_status: TaskStatus
#     notes: Optional[str]
#     created_at: datetime
#     completed_at: Optional[datetime]
#     updated_at: Optional[datetime]
#     # Intern info embedded
#     intern: Optional[AccountsInternInfo] = None

#     class Config:
#         from_attributes = True


# class AccountsTaskUpdate(BaseModel):
#     vendor_id: Optional[str] = None
#     payment_mode: Optional[str] = None
#     task_status: Optional[TaskStatus] = None
#     notes: Optional[str] = None


# # ── Self Review (Student) ────────────────────────────────────────────────────

# class SelfReviewIn(BaseModel):
#     overall_experience: int = Field(..., ge=1, le=5)
#     learning_rating: int = Field(..., ge=1, le=5)
#     mentorship_rating: int = Field(..., ge=1, le=5)
#     facilities_rating: int = Field(..., ge=1, le=5)
#     work_culture_rating: int = Field(..., ge=1, le=5)
#     key_learnings: str
#     challenges_faced: Optional[str] = None
#     suggestions: Optional[str] = None
#     would_recommend: bool = True
#     overall_feedback: str


# class SelfReviewOut(BaseModel):
#     id: UUID
#     overall_experience: Optional[int]
#     learning_rating: Optional[int]
#     mentorship_rating: Optional[int]
#     facilities_rating: Optional[int]
#     work_culture_rating: Optional[int]
#     key_learnings: Optional[str]
#     challenges_faced: Optional[str]
#     suggestions: Optional[str]
#     would_recommend: Optional[bool]
#     overall_feedback: Optional[str]
#     submitted_at: Optional[datetime]

#     class Config:
#         from_attributes = True


# # ── Stipend Payment ──────────────────────────────────────────────────────────

# class StipendPaymentIn(BaseModel):
#     payment_date: date
#     amount: float  # No default — must come from intern record
#     month_year: str
#     status: PaymentStatus = PaymentStatus.paid
#     utr_reference: Optional[str] = None
#     notes: Optional[str] = None


# class StipendPaymentOut(BaseModel):
#     id: UUID
#     payment_date: Optional[date]
#     amount: float
#     month_year: Optional[str]
#     status: PaymentStatus
#     utr_reference: Optional[str]
#     notes: Optional[str]
#     created_at: datetime

#     class Config:
#         from_attributes = True


# # ── IT Task ──────────────────────────────────────────────────────────────────

# class ITTaskOut(BaseModel):
#     id: UUID
#     laptop_required: bool
#     laptop_serial: Optional[str]
#     laptop_provisioned: bool
#     email_required: bool
#     abg_email_id: Optional[str]
#     email_provisioned: bool
#     other_assets: Optional[str]
#     other_assets_provisioned: bool
#     task_status: TaskStatus
#     notes: Optional[str]
#     created_at: datetime
#     completed_at: Optional[datetime]

#     class Config:
#         from_attributes = True


# class ITTaskUpdate(BaseModel):
#     laptop_serial: Optional[str] = None
#     laptop_provisioned: Optional[bool] = None
#     abg_email_id: Optional[str] = None
#     email_provisioned: Optional[bool] = None
#     other_assets_provisioned: Optional[bool] = None
#     task_status: Optional[TaskStatus] = None
#     notes: Optional[str] = None


# # ── Manager Review ────────────────────────────────────────────────────────────

# class ManagerReviewIn(BaseModel):
#     project_name: str
#     guide_names: str
#     performance_rating: int = Field(..., ge=1, le=5)
#     attitude_rating: int = Field(..., ge=1, le=5)
#     punctuality_rating: int = Field(..., ge=1, le=5)
#     technical_rating: int = Field(..., ge=1, le=5)
#     communication_rating: int = Field(..., ge=1, le=5)
#     overall_rating: int = Field(..., ge=1, le=5)
#     feedback_text: str
#     recommendation: Recommendation
#     eval_from_mgr: bool = True
#     panel_evaluation: bool = False
#     project_submission: bool = False
#     project_presentation: bool = False


# class ManagerReviewOut(BaseModel):
#     id: UUID
#     project_name: Optional[str]
#     guide_names: Optional[str]
#     performance_rating: Optional[int]
#     attitude_rating: Optional[int]
#     punctuality_rating: Optional[int]
#     technical_rating: Optional[int]
#     communication_rating: Optional[int]
#     overall_rating: Optional[int]
#     feedback_text: Optional[str]
#     recommendation: Optional[Recommendation]
#     eval_from_mgr: bool
#     panel_evaluation: bool
#     project_submission: bool
#     project_presentation: bool
#     submitted_at: Optional[datetime]
#     manager: Optional[UserOut]

#     class Config:
#         from_attributes = True


# # ── Experience Certificate ────────────────────────────────────────────────────

# class CertificateIn(BaseModel):
#     project_title: str
#     guide_names: str
#     conduct_remark: str = "good"
#     issue_date: date


# class CertificateOut(BaseModel):
#     id: UUID
#     pdf_url: Optional[str]
#     is_hr_uploaded: bool
#     project_title: Optional[str]
#     guide_names: Optional[str]
#     conduct_remark: Optional[str]
#     issue_date: Optional[date]
#     delivered_to_candidate: bool

#     class Config:
#         from_attributes = True


# # ── Dashboard ─────────────────────────────────────────────────────────────────

# class DashboardStats(BaseModel):
#     total_interns: int
#     active_interns: int
#     pending_docs_verification: int
#     pending_offer_response: int
#     pending_manager_review: int
#     certificates_issued: int
#     completion_rate: float


# # ── Portal info (what candidate sees when opening link) ───────────────────────

# class PortalInfo(BaseModel):
#     intern_record_id: UUID
#     candidate_email: str
#     role_title: str
#     department: str
#     location: str
#     start_date: date
#     end_date: date
#     stipend_amount: float
#     status: InternStatus
#     portal_submitted: bool
#     offer_status: Optional[str]
#     annexures_signed: List[str]  # ["A", "B"]
#     # Full candidate profile for pre-filling Step 1 on return visits
#     candidate_name: Optional[str] = None
#     institute_name: Optional[str] = None
#     city: Optional[str] = None
#     pan_card_no: Optional[str] = None
#     aadhaar_no: Optional[str] = None
#     # Personal
#     gender: Optional[str] = None
#     dob: Optional[str] = None
#     mobile: Optional[str] = None
#     contact_no: Optional[str] = None
#     address: Optional[str] = None
#     state: Optional[str] = None
#     pincode: Optional[str] = None
#     emergency_contact_name: Optional[str] = None
#     emergency_contact_phone: Optional[str] = None
#     # Academic
#     qualification: Optional[str] = None
#     course: Optional[str] = None
#     year_of_study: Optional[str] = None
#     graduation_year: Optional[int] = None
#     # Bank
#     bank_name: Optional[str] = None
#     account_number: Optional[str] = None
#     ifsc_code: Optional[str] = None
#     account_holder_name: Optional[str] = None
#     account_type: Optional[str] = None


# InternRecordOut.model_rebuild()




from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from app.models.models import (
    UserRole, InternStatus, OfferStatus, DocType, DocStatus,
    TaskStatus, PaymentStatus, AnnexureType, Recommendation
)


# ── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: str


class UserOut(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    department: Optional[str]
    location: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole
    department: Optional[str] = None
    location: Optional[str] = None


# ── Intern Record ────────────────────────────────────────────────────────────

class InternInitiateRequest(BaseModel):
    candidate_email: EmailStr
    role_title: str
    department: str
    location: str = Field(..., description="MBDD or TRADC")
    source: Optional[str] = None
    start_date: date
    end_date: date
    stipend_amount: float = 7000.0
    reporting_manager_id: Optional[UUID] = None
    laptop_required: bool = False
    corporate_email_required: bool = False
    other_assets: Optional[str] = None
    notes_for_accounts: Optional[str] = None
    review_due_date: Optional[date] = None

    # Candidate pre-fill fields (for offer letter generation before candidate fills portal)
    candidate_name: Optional[str] = None
    candidate_gender: Optional[str] = None          # "male" / "female"
    candidate_mobile: Optional[str] = None
    institute_name: Optional[str] = None
    qualification: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    candidate_city: Optional[str] = None
    candidate_state: Optional[str] = None


class InternRecordOut(BaseModel):
    id: UUID
    serial_no: Optional[int]
    candidate_email: str
    role_title: str
    department: str
    location: str
    source: Optional[str]
    start_date: date
    end_date: date
    duration_weeks: Optional[int]
    stipend_amount: float
    laptop_required: bool
    corporate_email_required: bool
    other_assets: Optional[str]
    notes_for_accounts: Optional[str]
    status: InternStatus
    review_due_date: Optional[date]
    project_submission_done: bool
    project_presentation_done: bool
    eval_from_mgr_done: bool
    panel_evaluation_done: bool
    experience_certificate_issued: bool
    portal_submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    initiator: Optional[UserOut]
    reporting_manager: Optional[UserOut]
    candidate: Optional["CandidateOut"]
    offer_letter: Optional["OfferLetterOut"] = None
    experience_certificate: Optional["CertificateOut"] = None
    manager_review: Optional["ManagerReviewOut"] = None
    self_review: Optional["SelfReviewOut"] = None

    class Config:
        from_attributes = True


class InternListItem(BaseModel):
    id: UUID
    serial_no: Optional[int]
    candidate_email: str
    role_title: str
    department: str
    location: str
    start_date: date
    end_date: date
    stipend_amount: float
    status: InternStatus
    experience_certificate_issued: bool
    candidate_name: Optional[str] = None
    institute_name: Optional[str] = None

    class Config:
        from_attributes = True


class StatusUpdateRequest(BaseModel):
    status: InternStatus


# ── Candidate ────────────────────────────────────────────────────────────────

class CandidatePersonalIn(BaseModel):
    full_name: str
    gender: str
    dob: date
    mobile: str
    contact_no: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    pan_card_no: str
    aadhaar_no: str
    emergency_contact_name: str
    emergency_contact_phone: str


class CandidateAcademicIn(BaseModel):
    institute_name: str
    qualification: str
    course: str
    year_of_study: str
    graduation_year: int


class CandidateOut(BaseModel):
    id: UUID
    full_name: Optional[str]
    gender: Optional[str]
    dob: Optional[date]
    mobile: Optional[str]
    contact_no: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    pan_card_no: Optional[str]
    aadhaar_no: Optional[str]
    institute_name: Optional[str]
    qualification: Optional[str]
    course: Optional[str]
    year_of_study: Optional[str]
    graduation_year: Optional[int]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    bank_details: Optional["BankDetailsOut"] = None

    class Config:
        from_attributes = True


# ── Bank Details ─────────────────────────────────────────────────────────────

class BankDetailsIn(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    account_holder_name: str
    account_type: str = "savings"


class BankDetailsOut(BaseModel):
    id: UUID
    bank_name: Optional[str]
    account_number: Optional[str]
    ifsc_code: Optional[str]
    account_holder_name: Optional[str]
    account_type: Optional[str]

    class Config:
        from_attributes = True


# ── Full candidate portal submission ─────────────────────────────────────────

class CandidatePortalSubmit(BaseModel):
    privacy_accepted: bool = False
    personal: CandidatePersonalIn
    academic: CandidateAcademicIn
    bank: BankDetailsIn


# ── Documents ────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: UUID
    doc_type: DocType
    file_name: Optional[str]
    file_url: Optional[str]
    file_size_kb: Optional[int]
    status: DocStatus
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocVerifyRequest(BaseModel):
    status: DocStatus
    rejection_reason: Optional[str] = None


# ── Offer Letter ─────────────────────────────────────────────────────────────

class OfferLetterOut(BaseModel):
    id: UUID
    pdf_url: Optional[str]
    is_hr_uploaded: bool
    status: OfferStatus
    sent_at: Optional[datetime]
    responded_at: Optional[datetime]
    candidate_response: Optional[str]
    candidate_remarks: Optional[str]

    class Config:
        from_attributes = True


class OfferResponseRequest(BaseModel):
    response: str = Field(..., description="accepted | declined | clarification_requested")
    remarks: Optional[str] = None


# ── Annexure Signature ────────────────────────────────────────────────────────

class AnnexureSignIn(BaseModel):
    annexure_type: AnnexureType
    signed_place: str
    university_name: str
    candidate_name: str
    pan_card_no: Optional[str] = None   # Required for B
    aadhaar_no: Optional[str] = None    # Required for B


class AnnexureSignOut(BaseModel):
    id: UUID
    annexure_type: AnnexureType
    signed_at: Optional[datetime]
    signed_place: Optional[str]
    university_name: Optional[str]

    class Config:
        from_attributes = True


# ── Accounts Task ─────────────────────────────────────────────────────────────

class AccountsInternInfo(BaseModel):
    """Intern details embedded in accounts task response"""
    id: UUID
    candidate_email: str
    role_title: str
    department: str
    location: str
    start_date: date
    end_date: date
    duration_weeks: Optional[int]
    stipend_amount: float
    payment_frequency: str
    notes_for_accounts: Optional[str]
    candidate_name: Optional[str] = None
    institute_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_type: Optional[str] = None

    class Config:
        from_attributes = True


class AccountsTaskOut(BaseModel):
    id: UUID
    intern_record_id: UUID
    vendor_id: Optional[str]
    payment_mode: Optional[str]
    task_status: TaskStatus
    notes: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    updated_at: Optional[datetime]
    # Intern info embedded
    intern: Optional[AccountsInternInfo] = None

    class Config:
        from_attributes = True


class AccountsTaskUpdate(BaseModel):
    vendor_id: Optional[str] = None
    payment_mode: Optional[str] = None
    task_status: Optional[TaskStatus] = None
    notes: Optional[str] = None


# ── Self Review (Student) ────────────────────────────────────────────────────

class SelfReviewIn(BaseModel):
    overall_experience: int = Field(..., ge=1, le=5)
    learning_rating: int = Field(..., ge=1, le=5)
    mentorship_rating: int = Field(..., ge=1, le=5)
    facilities_rating: int = Field(..., ge=1, le=5)
    work_culture_rating: int = Field(..., ge=1, le=5)
    key_learnings: str
    challenges_faced: Optional[str] = None
    suggestions: Optional[str] = None
    would_recommend: bool = True
    overall_feedback: str


class SelfReviewOut(BaseModel):
    id: UUID
    overall_experience: Optional[int]
    learning_rating: Optional[int]
    mentorship_rating: Optional[int]
    facilities_rating: Optional[int]
    work_culture_rating: Optional[int]
    key_learnings: Optional[str]
    challenges_faced: Optional[str]
    suggestions: Optional[str]
    would_recommend: Optional[bool]
    overall_feedback: Optional[str]
    submitted_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Stipend Payment ──────────────────────────────────────────────────────────

class StipendPaymentIn(BaseModel):
    payment_date: date
    amount: float  # No default — must come from intern record
    month_year: str
    status: PaymentStatus = PaymentStatus.paid
    utr_reference: Optional[str] = None
    notes: Optional[str] = None


class StipendPaymentOut(BaseModel):
    id: UUID
    payment_date: Optional[date]
    amount: float
    month_year: Optional[str]
    status: PaymentStatus
    utr_reference: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── IT Task ──────────────────────────────────────────────────────────────────

class ITTaskOut(BaseModel):
    id: UUID
    laptop_required: bool
    laptop_serial: Optional[str]
    laptop_provisioned: bool
    email_required: bool
    abg_email_id: Optional[str]
    email_provisioned: bool
    other_assets: Optional[str]
    other_assets_provisioned: bool
    task_status: TaskStatus
    notes: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ITTaskUpdate(BaseModel):
    laptop_serial: Optional[str] = None
    laptop_provisioned: Optional[bool] = None
    abg_email_id: Optional[str] = None
    email_provisioned: Optional[bool] = None
    other_assets_provisioned: Optional[bool] = None
    task_status: Optional[TaskStatus] = None
    notes: Optional[str] = None


# ── Manager Review ────────────────────────────────────────────────────────────

class ManagerReviewIn(BaseModel):
    project_name: str
    guide_names: str
    performance_rating: int = Field(..., ge=1, le=5)
    attitude_rating: int = Field(..., ge=1, le=5)
    punctuality_rating: int = Field(..., ge=1, le=5)
    technical_rating: int = Field(..., ge=1, le=5)
    communication_rating: int = Field(..., ge=1, le=5)
    overall_rating: int = Field(..., ge=1, le=5)
    feedback_text: str
    recommendation: Recommendation
    eval_from_mgr: bool = True
    panel_evaluation: bool = False
    project_submission: bool = False
    project_presentation: bool = False


class ManagerReviewOut(BaseModel):
    id: UUID
    project_name: Optional[str]
    guide_names: Optional[str]
    performance_rating: Optional[int]
    attitude_rating: Optional[int]
    punctuality_rating: Optional[int]
    technical_rating: Optional[int]
    communication_rating: Optional[int]
    overall_rating: Optional[int]
    feedback_text: Optional[str]
    recommendation: Optional[Recommendation]
    eval_from_mgr: bool
    panel_evaluation: bool
    project_submission: bool
    project_presentation: bool
    submitted_at: Optional[datetime]
    manager: Optional[UserOut]

    class Config:
        from_attributes = True


# ── Experience Certificate ────────────────────────────────────────────────────

class CertificateIn(BaseModel):
    project_title: str
    guide_names: str
    conduct_remark: str = "good"
    issue_date: date


class CertificateOut(BaseModel):
    id: UUID
    pdf_url: Optional[str]
    is_hr_uploaded: bool
    project_title: Optional[str]
    guide_names: Optional[str]
    conduct_remark: Optional[str]
    issue_date: Optional[date]
    delivered_to_candidate: bool

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_interns: int
    active_interns: int
    pending_docs_verification: int
    pending_offer_response: int
    pending_manager_review: int
    certificates_issued: int
    completion_rate: float


# ── Portal info (what candidate sees when opening link) ───────────────────────

class PortalInfo(BaseModel):
    intern_record_id: UUID
    candidate_email: str
    role_title: str
    department: str
    location: str
    start_date: date
    end_date: date
    stipend_amount: float
    status: InternStatus
    portal_submitted: bool
    offer_status: Optional[str]
    annexures_signed: List[str]  # ["A", "B"]
    # Full candidate profile for pre-filling Step 1 on return visits
    candidate_name: Optional[str] = None
    institute_name: Optional[str] = None
    city: Optional[str] = None
    pan_card_no: Optional[str] = None
    aadhaar_no: Optional[str] = None
    # Personal
    gender: Optional[str] = None
    dob: Optional[str] = None
    mobile: Optional[str] = None
    contact_no: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    # Academic
    qualification: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    # Bank
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_type: Optional[str] = None


InternRecordOut.model_rebuild()