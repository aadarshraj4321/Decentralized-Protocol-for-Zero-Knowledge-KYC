import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import RequestCard from '../components/RequestCard';
import * as snarkjs from 'snarkjs';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const VERIFIER_API_URL = 'http://localhost:8081';

function UserWalletPage() {
  const [user, setUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [proofingStatus, setProofingStatus] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    if (storedUserData) {
      const parsedUser = JSON.parse(storedUserData);
      setUser(parsedUser);
      fetchPendingRequests(parsedUser.id);
    } else {
      navigate('/user-login');
    }
  }, [navigate]);

  const fetchPendingRequests = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/verification/requests/user/${userId}`);
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    }
  };

  const performVerification = async (isOnChain, request) => {
    setIsVerifying(true);
    setProofingStatus(`1. Starting verification for Request #${request.id}...`);
    setVerificationResult(null);
    
    try {
      setProofingStatus('1. Generating proof for isOver18...');
      const inputs = { birthYear: 1998, currentYear: 2024 };
      const { proof, publicSignals } = await snarkjs.plonk.fullProve(inputs, '/zk/isOver18.wasm', '/zk/isOver18.zkey');
      setProofingStatus('2. Proof generated successfully! ✅');

      const endpoint = isOnChain ? '/verify-on-chain' : '/verify';
      const statusMsg = isOnChain ? '3. Sending transaction to blockchain...' : '3. Sending proof for OFF-CHAIN verification...';
      setProofingStatus(statusMsg);

      const verifyResponse = await axios.post(`${VERIFIER_API_URL}${endpoint}`, { proof, publicSignals });
      setVerificationResult(verifyResponse.data);
      
      if (verifyResponse.data.isValid) {
        setProofingStatus('4. Verification successful! Updating status in database...');
        await axios.put(`${API_URL}/verification/request/${request.id}`, {
            status: 'completed',
            result: 'Yes',
            etherscan_url: verifyResponse.data.explorerUrl || null
        });
        setProofingStatus('5. Status updated! Request has been completed. 🎉');
        // Refresh the list of pending requests, which will make this one disappear
        fetchPendingRequests(user.id);
      } else {
        setProofingStatus(`4. Verification Failed: ${verifyResponse.data.message}`);
      }
    } catch (error) {
      console.error(`Error during verification:`, error);
      const message = error.response?.data?.message || error.message;
      setProofingStatus(`Failed: ${message}`);
      setVerificationResult({ isValid: false, message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/user-login');
  };

  if (!user) { return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Redirecting to login...</p></div>; }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          My Digital Wallet <span className="text-lg font-normal text-gray-500">({user.email})</span>
        </h1>
        <button onClick={handleSignOut} className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600">Sign Out</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Pending Requests ({pendingRequests.length})</h2>
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <RequestCard 
                  key={request.id}
                  verifierName={request.verifier.company_name}
                  policy={request.policy_to_check}
                  onApprove={() => performVerification(true, request)}
                  onDeny={() => alert('Deny functionality not implemented.')}
                  disabled={isVerifying}
                />
              ))
            ) : (
              <div className="text-center p-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
                <p className="text-gray-500 dark:text-gray-400">You have no pending verification requests.</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Verification Status</h2>
          <Card>
            {isVerifying ? (
              <div>
                <p className="font-bold">Status:</p>
                <p className="mt-2 p-3 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm">{proofingStatus}</p>
              </div>
            ) : <p className="text-gray-500 dark:text-gray-400">Approve a request to see its status here.</p>}

            {verificationResult && !isVerifying && (
               <div className={`mt-4 p-4 rounded-lg font-bold text-center ${verificationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p>{verificationResult.message}</p>
                {verificationResult.explorerUrl && (<a href={verificationResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-blue-600 hover:underline mt-2 block">View Transaction on Etherscan</a>)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserWalletPage;