const express = require('express');
const snarkjs = require('snarkjs');
const fs = require('fs');
const cors = require('cors');
const { ethers } = require("ethers");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 8081;

// --- Off-Chain Verification Setup ---
let vKey;
try {
    vKey = JSON.parse(fs.readFileSync("./keys/verification_key.json"));
    console.log("Off-chain verification key loaded successfully.");
} catch (error) {
    console.error("FATAL: Could not load off-chain verification_key.json.", error);
    process.exit(1);
}

// --- On-Chain Verification Setup ---
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
let verifierContract, wallet;

if (SEPOLIA_RPC_URL && SERVER_WALLET_PRIVATE_KEY && CONTRACT_ADDRESS) {
    try {
        const verifierABI = JSON.parse(fs.readFileSync("./keys/VerifierABI.json"));
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        wallet = new ethers.Wallet(SERVER_WALLET_PRIVATE_KEY, provider);
        verifierContract = new ethers.Contract(CONTRACT_ADDRESS, verifierABI, wallet);
        console.log(`On-chain verification configured. Connected to Sepolia. Server wallet address: ${wallet.address}`);
    } catch (e) {
        console.log("WARNING: Could not configure on-chain verifier. Check ABI file.", e);
        verifierContract = null;
    }
} else {
    console.log("WARNING: Missing .env variables for on-chain verification.");
}

// =================================================================
// === API ROUTES ==================================================
// =================================================================

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Node.js Verifier Service is running!' });
});

app.post('/verify', async (req, res) => {
    // This off-chain handler remains the same
    try {
        const { proof, publicSignals } = req.body;
        if (!proof || !publicSignals) return res.status(400).json({ isValid: false, message: "Missing proof/signals." });
        const isValid = await snarkjs.plonk.verify(vKey, publicSignals, proof);
        if (isValid) {
            res.status(200).json({ isValid: true, message: "Proof successfully verified (Off-Chain)!" });
        } else {
            res.status(200).json({ isValid: false, message: "Proof is not valid (Off-Chain)." });
        }
    } catch (error) {
        console.error("Off-chain verification error:", error);
        res.status(500).json({ isValid: false, message: "An error occurred during off-chain verification." });
    }
});

app.post('/verify-on-chain', async (req, res) => {
    if (!verifierContract) {
         return res.status(500).json({ isValid: false, message: "On-chain verification is not configured on the server." });
    }
    try {
        const { proof, publicSignals } = req.body;
        if (!proof || !publicSignals) return res.status(400).json({ isValid: false, message: "Missing proof/signals." });

        const proofForContract = [
            proof.A[0], proof.A[1], proof.B[0], proof.B[1],
            proof.C[0], proof.C[1], proof.Z[0], proof.Z[1],
            proof.T1[0], proof.T1[1], proof.T2[0], proof.T2[1],
            proof.T3[0], proof.T3[1], proof.Wxi[0], proof.Wxi[1],
            proof.Wxiw[0], proof.Wxiw[1], proof.eval_a, proof.eval_b,
            proof.eval_c, proof.eval_s1, proof.eval_s2, proof.eval_zw
        ];
        
        console.log("Submitting STATE-CHANGING transaction to blockchain...");
        
        // ** THIS IS THE CORRECT LOGIC FOR A TRANSACTIONAL CALL **
        // Because the contract function is no longer 'view', ethers.js returns a transaction object.
        const tx = await verifierContract.verifyProof(proofForContract, publicSignals);
        
        console.log(`Transaction sent! Hash: ${tx.hash}. Waiting for confirmation...`);
        // We wait for the transaction to be mined and included in a block.
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);

        // Check the receipt to be 100% sure the transaction didn't fail on-chain
        if (receipt.status === 0) {
            throw new Error("Transaction was mined but reverted. The proof is invalid.");
        }

        // If we reach this line, the transaction was successful.
        res.status(200).json({
            isValid: true,
            message: "Proof successfully verified on-chain!",
            txHash: tx.hash,
            explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`
        });
    } catch (error) {
        console.error("On-chain verification error:", error);
        res.status(500).json({
            isValid: false,
            message: "On-chain verification failed. The proof is likely invalid or the transaction reverted.",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Node.js verifier service listening on port ${PORT}`);
});