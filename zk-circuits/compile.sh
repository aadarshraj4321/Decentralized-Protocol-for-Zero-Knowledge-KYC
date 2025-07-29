#!/bin/bash

echo "✅ Using LOCAL circom compiler to build the circuit."

# --- CONFIGURATION ---
CIRCUIT_NAME="isOver18"
POWER_OF_TAU=14 # This is a good size for this circuit

# --- SCRIPT ---

# 1. Define paths
CIRCUIT_PATH="./circuits/${CIRCUIT_NAME}.circom"
BUILD_DIR="./circuits/build"
CIRCUIT_BUILD_DIR="${BUILD_DIR}/${CIRCUIT_NAME}"
R1CS_FILE="${CIRCUIT_BUILD_DIR}/${CIRCUIT_NAME}.r1cs"
WASM_FILE="${CIRCUIT_BUILD_DIR}/${CIRCUIT_NAME}.wasm"
ZKEY_FILE="${CIRCUIT_BUILD_DIR}/${CIRCUIT_NAME}.zkey"
VKEY_FILE="${CIRCUIT_BUILD_DIR}/verification_key.json"
SOL_FILE="${CIRCUIT_BUILD_DIR}/Verifier.sol"

PTAU_DIR="./circuits"
PTAU_FILE_0="${PTAU_DIR}/pot${POWER_OF_TAU}_0000.ptau"
PTAU_FILE_1="${PTAU_DIR}/pot${POWER_OF_TAU}_0001.ptau"
PTAU_FINAL="${PTAU_DIR}/pot${POWER_OF_TAU}_final.ptau"

# 2. Create the build directory
mkdir -p ${CIRCUIT_BUILD_DIR}

# 3. Compile the circuit
echo "Step 1: Compiling ${CIRCUIT_NAME}.circom..."
circom ${CIRCUIT_PATH} --r1cs --wasm -l ./node_modules -o ${BUILD_DIR}
if [ ! -f "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" ]; then echo "❌ Circom compilation failed."; exit 1; fi
echo "   Compilation successful."

mv ${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm ${WASM_FILE}
mv ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs ${R1CS_FILE}
rm -rf ${BUILD_DIR}/${CIRCUIT_NAME}_js

# 4. Start Powers of Tau ceremony
echo "Step 2: Starting Powers of Tau ceremony..."
npx snarkjs powersoftau new bn128 ${POWER_OF_TAU} ${PTAU_FILE_0} -v

# 5. Contribute to the ceremony
echo "Step 3: Contributing to ceremony..."
npx snarkjs powersoftau contribute ${PTAU_FILE_0} ${PTAU_FILE_1} --name="My Contribution" -v

# 6. *** THE MISSING STEP ***
#    Prepare the final phase 2 ptau file for PLONK
echo "Step 4: Preparing final ptau for PLONK..."
npx snarkjs powersoftau prepare phase2 ${PTAU_FILE_1} ${PTAU_FINAL} -v

# 7. Setup PLONK keys
echo "Step 5: Setting up PLONK keys..."
npx snarkjs plonk setup ${R1CS_FILE} ${PTAU_FINAL} ${ZKEY_FILE}

# 8. Export the verification key
echo "Step 6: Exporting verification key..."
npx snarkjs zkey export verificationkey ${ZKEY_FILE} ${VKEY_FILE}

# 9. Export the Solidity verifier
echo "Step 7: Exporting Solidity Verifier..."
npx snarkjs zkey export solidityverifier ${ZKEY_FILE} ${SOL_FILE}

# 10. Clean up temporary ptau files
rm -f ${PTAU_FILE_0} ${PTAU_FILE_1} ${PTAU_FINAL}

echo ""
echo "✅✅✅ All done! Keys and verifier for '${CIRCUIT_NAME}' are in ${CIRCUIT_BUILD_DIR}"