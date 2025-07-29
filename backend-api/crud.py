# backend-api/crud.py

from sqlalchemy.orm import Session
import models, schemas, security
import uuid

# === User CRUD Operations ===

def get_user_by_email(db: Session, email: str):
    """
    Fetches a single user from the database based on their email.
    """
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    """
    Creates a new user in the database with a hashed password.
    """
    hashed_password = security.get_password_hash(user.password)
    # For now, we are not creating a DID, it can be added later.
    db_user = models.User(email=user.email, hashed_password=hashed_password, did=f"did:example:{uuid.uuid4()}")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# === Verifier CRUD Operations ===

def get_verifier_by_company_name(db: Session, company_name: str):
    """
    Fetches a single verifier from the database based on their company name.
    """
    return db.query(models.Verifier).filter(models.Verifier.company_name == company_name).first()


def create_verifier(db: Session, verifier: schemas.VerifierCreate):
    api_key = str(uuid.uuid4())
    # Hash the password provided during sign-up
    hashed_password = security.get_password_hash(verifier.password) 
    db_verifier = models.Verifier(
        company_name=verifier.company_name,
        hashed_password=hashed_password, # Store the hashed password
        api_key=api_key
    )
    db.add(db_verifier)
    db.commit()
    db.refresh(db_verifier)
    return db_verifier


# === Verification Request CRUD Operations ===

def create_verification_request(db: Session, verifier_id: int, user_id: int, policy: str):
    """
    Creates a new verification request in the database with a 'pending' status.
    """
    db_request = models.VerificationRequest(
        verifier_id=verifier_id,
        user_id=user_id,
        policy_to_check=policy,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request








def get_requests_for_user(db: Session, user_id: int):
    """
    Fetches all pending verification requests for a specific user.
    """
    return db.query(models.VerificationRequest).filter(
        models.VerificationRequest.user_id == user_id,
        models.VerificationRequest.status == 'pending'
    ).all()

def get_requests_by_verifier(db: Session, verifier_id: int):
    """
    Fetches all verification requests initiated by a specific verifier.
    """
    return db.query(models.VerificationRequest).order_by(
        models.VerificationRequest.created_at.desc()
    ).filter(models.VerificationRequest.verifier_id == verifier_id).all()








def update_verification_request(db: Session, request_id: int, status: str, result: str, etherscan_url: str):
    """
    Finds a verification request by its ID and updates its status, result,
    and etherscan_url.
    """
    db_request = db.query(models.VerificationRequest).filter(models.VerificationRequest.id == request_id).first()
    if not db_request:
        # In a real app, you might want to raise an exception here.
        # For now, we'll just log it if it happens.
        print(f"Error: Could not find request ID {request_id} to update.")
        return None
    
    db_request.status = status
    db_request.result = result
    # Only update the URL if one is provided
    if etherscan_url:
        db_request.etherscan_url = etherscan_url
    
    db.commit()
    db.refresh(db_request)
    return db_request