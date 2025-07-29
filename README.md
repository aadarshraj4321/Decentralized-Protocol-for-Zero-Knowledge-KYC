# Decentralized Protocol for Zero-Knowledge-KYC
This project is a fully functional prototype of a Zero-Knowledge Know-Your-Customer (ZK-KYC) service, built as a SaaS platform. It allows digital services like fintechs and crypto exchanges to verify user attributes (e.g., "is over 18") without ever accessing the user's sensitive personal identifying information (PII).

## Table of Contents
    The Problem: The Paradox of Digital Identity
    Our Solution: Privacy by Design
    Key Differentiators
    System Architecture
    Architectural Diagram
    Core Principles & Microservices
    Technology Stack
    Why This Stack?
    The Zero-Knowledge Core
    The Mathematics: zk-SNARKs
    The Tools: Circom & SnarkJS
    The Blockchain Layer: Trustless Verification
    End-to-End Workflow
    Getting Started
    Prerequisites
    Cloning the Repository
    Configuration
    Running the Project
    Future Roadmap

### The Problem: The Paradox of Digital Identity
* In the modern digital economy, identity verification (KYC/AML) is a legal and operational necessity for countless services. However, the current model is fundamentally flawed:
Massive Privacy Leaks: Users are forced to upload sensitive documents (passports, government IDs) to numerous services. This creates centralized "honeypots" of personal data that are prime targets for hackers. A single data breach can expose the PII of millions.

* Compliance Burden: Companies become custodians of toxic data assets. Storing and securing PII is expensive and carries significant legal and financial risks under regulations like GDPR, CCPA, and India's DPDP Act.

* Poor User Experience: Users must repeat the same tedious and intrusive KYC process for every new service they wish to use.

* This creates a paradox: to participate in the digital world, users must surrender their privacy, and to comply with the law, companies must assume enormous risk.

* Our Solution: Privacy by Design
This Zero-Knowledge-KYC Engine resolves the paradox by decoupling verification from data exposure. Our service acts as a cryptographic intermediary that brokers trust, providing definitive "Yes/No" answers to policy questions without ever seeing the underlying data.

* When a company asks, "Is this user a resident of the USA?", our engine facilitates a process where the user generates a cryptographic proof of this fact. The fintech receives a verifiable "Yes" or "No", but never learns the user's actual address.

* Key Differentiators
* This project is distinct from standard full-stack applications in several key areas:
* Privacy Preservation: The core value proposition is privacy. Unlike other identity solutions, our service is architecturally incapable of seeing or storing user PII during the verification process.
User Control & Self-Sovereign Identity (SSI): The user holds their own data (in the form of a Verifiable Credential) and generates the proof on their own device (client-side). They have ultimate control over when and how their identity is used.
* Trustless Verification Layer: By integrating an on-chain verifier, we offer an optional, ultimate source of truth. A verification can be confirmed on a public blockchain, creating a permanent, tamper-proof, and publicly auditable record that does not depend on trusting our service.
* Advanced Technical Architecture: It employs a sophisticated microservice architecture, combining multiple languages (Python, Go/Node.js) and technologies (Docker, ZK-SNARKs, Blockchain) chosen specifically for their suitability to the task at hand.
System Architecture



#### The system is designed as a distributed, multi-service application to ensure scalability, separation of concerns, and resilience.

#### Architectural Diagram

    +----------------+      +-------------------------+      +------------------+
    |   End User     |      |  Our ZK-KYC Engine (SaaS) |      | Verifier (Fintech)|
    | (React Wallet) |      |                         |      |  (React Dashboard)|
    +----------------+      +-------------------------+      +------------------+
        ^                       |              ^                       ^
        | 1. Generate Proof     | 2. Submit    | 3. Create Request     | 4. Check Status
        |                       v              |                       |
        |               +---------------------+                       |
        |               | Python Backend API  |                       |
        |               | (FastAPI, PostgreSQL) |                       |
        |               | - User/Verifier Mgmt  |                       |
        |               | - Request Orchestration|                       |
        |               +---------------------+                       |
        |                       | 4a. Update Status                     |
        |                       v                                       |
        +---------------->+---------------------+<----------------------+
                            | Node.js Verifier Svc|
                            | (Express, SnarkJS)  |
                            | - Off-Chain Verify  |
                            | - On-Chain Verify   |
                            +---------------------+
                                    |
                                    v
                            +---------------------+
                            | Blockchain (Sepolia)|
                            | (Solidity Verifier) |
                            +---------------------+


### Core Principles & Microservices
We use a microservice architecture to delegate specific, high-load, or specialized tasks to dedicated services.
Why Microservices? A monolithic application would struggle to scale the CPU-intensive task of proof verification without slowing down the entire system. By separating the Verifier Service, we can scale it independently. It also allows us to use the best language for each job (polyglot architecture).
Python Backend API: The "brain" of the operation. It handles business logic that is not performance-critical: user and verifier account management, request creation, and storing the state of verification requests in the PostgreSQL database.
Node.js Verifier Service: The "engine room". This is a lightweight, high-performance service dedicated to one task: verifying ZK proofs. It provides two methods:
Off-Chain: A fast, private verification using the snarkjs library.
On-Chain: A high-trust verification by sending a transaction to a public blockchain.
Frontend Applications: Two separate React applications serve our distinct user bases: the Verifier Dashboard for our B2B clients and the User Wallet for the end-users.


### Technology Stack
* Backend API	Python, FastAPI, PostgreSQL, SQLAlchemy	FastAPI provides incredible performance and automatic documentation for building robust APIs. PostgreSQL is a reliable, production-grade database.
Verifier Service	Node.js, Express.js	Node.js offers a mature ecosystem for cryptographic libraries (snarkjs) and blockchain interaction (ethers.js), making it ideal for the verification task.
Frontend	React, Vite, Tailwind CSS	A modern, fast, and highly productive stack for building beautiful and responsive user interfaces.

* Zero-Knowledge Proofs	Circom, SnarkJS (PLONK)	Circom is a powerful DSL for writing ZK circuits. SnarkJS provides a complete toolchain for compiling circuits, generating keys, proving, and verifying in JavaScript.

* Blockchain	Solidity, Ethereum (Sepolia), Ethers.js	Solidity is the industry standard for smart contracts. Deploying to a public testnet like Sepolia demonstrates real-world Web3 skills without financial cost.

* Containerization	Docker, Docker Compose	Encapsulates each service for consistent development and easy deployment. Manages the entire multi-service application with a single command.
The Zero-Knowledge Core

* The Mathematics: zk-SNARKs
    At its heart, the project uses zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge). A zk-SNARK allows a "Prover" (the user) to convince a "Verifier" (our service) that a statement is true, without revealing any information beyond the validity of the statement itself.
    This is achieved by converting the statement (e.g., currentYear - birthYear >= 18) into a mathematical representation called an Arithmetic Circuit. The user then uses their private data (the "witness") to generate a small, difficult-to-forge proof that satisfies the circuit's equations.

* The Tools: Circom & SnarkJS
    Circom: We use Circom, a domain-specific language, to write the blueprint for our statement. The .circom files in this repository define the rules of the KYC policies as a set of mathematical constraints.
    SnarkJS: We use the snarkjs library for the entire lifecycle of the circuit:
    Compiling: Turning the Circom blueprint into a machine-readable format (.r1cs).
    Key Generation (Trusted Setup): Running a ceremony (powersoftau, plonk setup) to generate a Proving Key (for making proofs) and a Verification Key (for checking proofs).
    Proving: Executing the circuit with the user's private data to generate the final proof object (done client-side in the browser).
    Verifying: Checking the proof against the verification key (done server-side).
    The Blockchain Layer: Trustless Verification
    While our Node.js service provides fast verification, a company may require an even higher level of assurance. The on-chain verification provides this.
    How it's implemented: We use snarkjs to export our Verification Key as a Solidity smart contract. This contract contains the verification logic itself. We deploy this contract to a public testnet (Sepolia).
    Why it's powerful: When our backend sends a proof to this contract, the verification is executed by the decentralized Ethereum network. The result is a public, permanent, and tamper-proof transaction record. This provides an unforgeable audit trail that does not require trusting our service at all.

* End-to-End Workflow
Onboarding (One-time): A User signs up on our platform. They use a mock "Issuer" endpoint to receive a digitally signed credential containing their PII (e.g., birthYear).
Request: A Verifier (Fintech) logs into their dashboard, finds a user by email, and initiates a KYC request (e.g., for the "isOver18" policy). This is saved in the database.
Approval: The User logs into their wallet, sees the pending request, and clicks "Approve".
Client-Side Proving: The User's browser loads the credential, the relevant .wasm and .zkey files, and generates a ZK proof locally.

* Verification: The proof is sent to our Node.js Verifier Service.
Off-Chain: The service uses snarkjs to verify the proof instantly.
On-Chain: The service sends a transaction to the deployed Solidity verifier contract on the Sepolia testnet.

* Callback & Update: After successful verification, the Node.js service calls our Python API to update the request's status to "completed" and store the Etherscan link (if applicable).
Result: The Verifier sees the updated status and the Etherscan link in their dashboard's request history.

### Getting Started

* Prerequisites
    Docker & Docker Compose: For running the backend services. (Install from Docker's website)
    Node.js & npm: For running the frontend and circuit scripts. (Install from nodejs.org)
    Rust & Cargo: For installing the circom compiler. (Install from rustup.rs)
    Git: For cloning the repository.

* Cloning the Repository
    git clone https://github.com/aadarshraj4321/Decentralized-Protocol-for-Zero-Knowledge-KYC
    cd zk-kyc-engine


* Configuration
    The project requires several environment variables.
    Root .env file: Create a file named .env in the project root for the Python API.
    # zk-kyc-engine/.env
    DATABASE_URL="postgresql://kycuser:kycpassword@db:5432/kycdb" # use your neon db URL if not using local Postgres
    Env
    Verifier Service .env file: Create a file named .env inside the verifier-svc directory.
    # zk-kyc-engine/verifier-svc/.env
    SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY"
    SERVER_WALLET_PRIVATE_KEY="YOUR_TESTNET_WALLET_PRIVATE_KEY"
    CONTRACT_ADDRESS="YOUR_DEPLOYED_VERIFIER_CONTRACT_ADDRESS"
    Env
    Running the Project
    The project must be run in three parts.
    Compile Circuits & Generate Keys (One-time setup):

### Navigate to the circuits directory
    cd zk-circuits

### Install dependencies
    npm install

    # install the circom compiler (if not already installed)
    # follow the steps in the documentation if `cargo install circom` fails.
    cargo install circom

### Run the compilation script
    ./compile.sh # Or the relevant script name
  
    Start Backend Services:
    Open a new terminal in the project root.
    docker-compose up --build
    Start Frontend Application:
    Open a third terminal.

### Navigate to the frontend directory
    cd frontend

### install dependencies
    npm install


### Start the development server
    npm run dev
    Your application will be available at http://localhost:5173.


### Future Roadmap

This prototype is a strong foundation. Future work could include:
Expanding Circuit Library: Adding more complex KYC circuits (non-US residency, not on a sanctions list).
Decentralized Identifiers (DIDs) & Verifiable Credentials (VCs): Replacing the mock issuer with a fully compliant W3C VC issuer.
Gasless Transactions: Implementing a relayer so that users do not need to have ETH to approve on-chain requests.
Production Deployment: Creating deployment scripts for cloud services like AWS or DigitalOcean.
Security Audit: A full professional security audit of the circuits and smart contracts.