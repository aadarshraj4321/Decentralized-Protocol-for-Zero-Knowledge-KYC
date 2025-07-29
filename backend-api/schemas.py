from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
import datetime

# --- Pydantic V2 Configuration ---
# We create a base class that uses the new `from_attributes` config.
# All our other schemas that map to database models will inherit from this.
# This replaces the old `class Config: orm_mode = True` and removes the warning.
class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# =================================================================
# === Forward Declarations for Nested Schemas =====================
# =================================================================
# To handle circular dependencies (e.g., User has Requests, Request has User),
# we need to declare the basic shapes of our schemas first.

class VerificationRequestBase(AppBaseModel):
    id: int
    policy_to_check: str
    status: str
    result: Optional[str] = None
    etherscan_url: Optional[str] = None
    created_at: datetime.datetime

class UserBase(AppBaseModel):
    id: int
    email: EmailStr

class VerifierBase(AppBaseModel):
    id: int
    company_name: str


# =================================================================
# === Main Schemas ================================================
# =================================================================

# --- User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    # This schema represents a full User object, including their requests.
    verification_requests: List[VerificationRequestBase] = []


# --- Verifier Schemas ---
class VerifierCreate(BaseModel):
    company_name: str
    password: str

class Verifier(VerifierBase):
    # This schema represents a full Verifier object, including their API key and requests.
    api_key: str
    is_active: bool
    verification_requests: List[VerificationRequestBase] = []


# --- Verification Request Schemas ---
class VerificationRequestCreate(BaseModel):
    user_id: int
    policy: str

class VerificationRequest(VerificationRequestBase):
    # This is the standard request object.
    user_id: int
    verifier_id: int

class VerificationRequestWithRelations(VerificationRequest):
    # This is the special schema for API responses where we want to include
    # the full User and Verifier objects, not just their IDs.
    user: UserBase
    verifier: VerifierBase


# =================================================================
# === Other Schemas ===============================================
# =================================================================

# --- Issuer Schemas ---
class CredentialIssueRequest(BaseModel):
    user_id: int
    birth_year: int

class VerifiableCredential(BaseModel):
    issuer_did: str
    subject_id: int
    claim_data: dict
    signature: str

# --- Token Schemas (for Login) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None