import os
import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Import all our local modules
import models
import schemas
import crud
import security
from database import get_db

app = FastAPI(
    title="ZK-KYC Engine API",
    description="A service to manage users, verifiers, and Zero-Knowledge KYC requests.",
    version="0.1.0"
)

# === CORS Middleware Configuration ===
origins = [
    "http://localhost",
    "http://localhost:5173",  # Frontend
    "http://localhost:8081",  # Verifier Service
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Authentication Dependency ===
def get_verifier_from_api_key(api_key: str = Header(None), db: Session = Depends(get_db)):
    if api_key is None: raise HTTPException(status_code=401, detail="API Key header is missing")
    verifier = db.query(models.Verifier).filter(models.Verifier.api_key == api_key).first()
    if not verifier or not verifier.is_active: raise HTTPException(status_code=401, detail="Invalid API Key or Verifier is inactive")
    return verifier

# =================================================================
# === API ROUTES ==================================================
# =================================================================

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok"}

# === User Endpoints ===
@app.post("/users/", response_model=schemas.User, tags=["Users"], status_code=201)
def create_user_endpoint(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/users/token", response_model=schemas.Token, tags=["Users"])
def login_user_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = security.create_access_token(data={"sub": user.email, "type": "user"})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/by-email/", response_model=schemas.User, tags=["Users"])
def get_user_by_email_endpoint(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=email)
    if not user: raise HTTPException(status_code=404, detail="User with that email not found")
    return user

# === Verifier Endpoints ===
@app.post("/verifiers/", response_model=schemas.Verifier, tags=["Verifiers"], status_code=201)
def create_verifier_endpoint(verifier: schemas.VerifierCreate, db: Session = Depends(get_db)):
    db_verifier = crud.get_verifier_by_company_name(db, company_name=verifier.company_name)
    if db_verifier: raise HTTPException(status_code=400, detail="Company name already registered")
    return crud.create_verifier(db=db, verifier=verifier)

@app.post("/verifiers/token", response_model=schemas.Token, tags=["Verifiers"])
def login_verifier_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    verifier = crud.get_verifier_by_company_name(db, company_name=form_data.username)
    if not verifier or not security.verify_password(form_data.password, verifier.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect company name or password")
    access_token = security.create_access_token(data={"sub": verifier.company_name, "type": "verifier"})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/verifiers/by-name/", response_model=schemas.Verifier, tags=["Verifiers"])
def get_verifier_by_name_endpoint(name: str, db: Session = Depends(get_db)):
    verifier = crud.get_verifier_by_company_name(db, company_name=name)
    if not verifier: raise HTTPException(status_code=404, detail="Verifier with that name not found")
    return verifier

# === Issuer Endpoint ===
@app.post("/issuer/issue-credential", response_model=schemas.VerifiableCredential, tags=["Issuer"])
def issue_credential(request: schemas.CredentialIssueRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    claim_data_to_encode = { "sub": user.id, "iss": security.ISSUER_DID, "iat": datetime.datetime.utcnow().timestamp(), "claim": { "birthYear": request.birth_year, "country": "USA" } }
    signature = jwt.encode(claim_data_to_encode, security.JWT_SECRET_KEY, algorithm=security.ALGORITHM)
    return schemas.VerifiableCredential(issuer_did=security.ISSUER_DID, subject_id=user.id, claim_data={"birthYear": request.birth_year, "country": "USA"}, signature=signature)

# === Verification Flow Endpoints ===
@app.post("/verification/request", response_model=schemas.VerificationRequest, tags=["Verification"])
def request_verification(request_data: schemas.VerificationRequestCreate, db: Session = Depends(get_db), verifier: models.Verifier = Depends(get_verifier_from_api_key)):
    user = db.query(models.User).filter(models.User.id == request_data.user_id).first()
    if not user: raise HTTPException(status_code=404, detail=f"User with ID {request_data.user_id} not found")
    return crud.create_verification_request(db=db, verifier_id=verifier.id, user_id=request_data.user_id, policy=request_data.policy)

# --- NEW ENDPOINTS FOR DAY 19 ---

@app.get("/verification/requests/user/{user_id}", response_model=List[schemas.VerificationRequestWithRelations], tags=["Verification"])
def get_user_verification_requests(user_id: int, db: Session = Depends(get_db)):
    """An endpoint for a user's wallet to fetch their pending KYC requests."""
    # In a real app, this should be protected by user authentication (e.g., a JWT token)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return crud.get_requests_for_user(db=db, user_id=user_id)

@app.get("/verification/requests/verifier", response_model=List[schemas.VerificationRequestWithRelations], tags=["Verification"])
def get_verifier_request_history(db: Session = Depends(get_db), verifier: models.Verifier = Depends(get_verifier_from_api_key)):
    """An endpoint for a verifier to fetch their entire request history."""
    return crud.get_requests_by_verifier(db=db, verifier_id=verifier.id)

class VerificationUpdate(BaseModel):
    status: str
    result: Optional[str] = None
    etherscan_url: Optional[str] = None

@app.put("/verification/request/{request_id}", response_model=schemas.VerificationRequest, tags=["Verification"])
def update_verification_status(request_id: int, update_data: VerificationUpdate, db: Session = Depends(get_db)):
    """An endpoint for the verifier service to call back and update a request's status."""
    return crud.update_verification_request(
        db=db,
        request_id=request_id,
        status=update_data.status,
        result=update_data.result,
        etherscan_url=update_data.etherscan_url
    )