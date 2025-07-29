# backend-api/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base 

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # DID (Decentralized Identifier) for the user
    did = Column(String, unique=True, index=True, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    credentials = relationship("Credential", back_populates="owner")
    verification_requests = relationship("VerificationRequest", back_populates="user")

class Verifier(Base):
    __tablename__ = "verifiers"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False) # <-- ADD THIS LINE
    api_key = Column(String, unique=True, nullable=False)
    webhook_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    requests_made = relationship("VerificationRequest", back_populates="verifier")

class Credential(Base):
    __tablename__ = "credentials"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    # The full, signed Verifiable Credential JSON
    vc_data_json = Column(String, nullable=False) 
    issuer_did = Column(String, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="credentials")

class VerificationRequest(Base):
    __tablename__ = "verification_requests"
    id = Column(Integer, primary_key=True, index=True)
    verifier_id = Column(Integer, ForeignKey("verifiers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    policy_to_check = Column(String, nullable=False) # e.g., "isOver18"
    status = Column(String, default="pending") # pending, completed, failed
    result = Column(String, nullable=True) # "Yes", "No", or null
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    verifier = relationship("Verifier", back_populates="requests_made")
    user = relationship("User", back_populates="verification_requests")