import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function DashboardPage() {
  const [verifier, setVerifier] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [foundUserId, setFoundUserId] = useState('');
  const [findUserStatus, setFindUserStatus] = useState('');
  const [newRequestPolicy, setNewRequestPolicy] = useState('isOver18');
  const [requestStatus, setRequestStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedVerifierData = localStorage.getItem('verifier');
    if (storedVerifierData) {
      const parsedVerifier = JSON.parse(storedVerifierData);
      setVerifier(parsedVerifier);
      fetchRequestHistory(parsedVerifier.api_key);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchRequestHistory = async (apiKey) => {
    if (!apiKey) return;
    try {
      const response = await axios.get(`${API_URL}/verification/requests/verifier`, {
        headers: { 'api-key': apiKey }
      });
      setRequestHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch request history:", error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('verifier');
    setVerifier(null);
    navigate('/login');
  };

  const handleFindUser = async (event) => {
    event.preventDefault();
    setFindUserStatus('Finding user...');
    setFoundUserId('');
    setRequestStatus('');
    try {
      const response = await axios.get(`${API_URL}/users/by-email/?email=${userEmail}`);
      setFoundUserId(response.data.id);
      setFindUserStatus(`Success! Found user with ID: ${response.data.id}`);
    } catch (error) {
      setFindUserStatus(`Error: ${error.response?.data?.detail || "User not found."}`);
    }
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setRequestStatus('');
    if (!foundUserId) { setRequestStatus('Error: Please find a user by email first.'); return; }
    
    try {
      setRequestStatus('Sending request...');
      await axios.post(
        `${API_URL}/verification/request`,
        { user_id: parseInt(foundUserId, 10), policy: newRequestPolicy },
        { headers: { 'api-key': verifier.api_key } }
      );
      setRequestStatus(`Success! Request sent for User ID: ${foundUserId}.`);
      setFoundUserId(''); setUserEmail(''); setFindUserStatus('');
      // After sending a new request, refresh the history table to show it
      fetchRequestHistory(verifier.api_key);
    } catch (error) {
      setRequestStatus(`Error: ${error.response?.data?.detail || "An unknown error occurred."}`);
    }
  };

  if (!verifier) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, <span className="text-indigo-600">{verifier.company_name}</span>
        </h1>
        <button onClick={handleSignOut} className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600">
          Sign Out
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 space-y-6">
          <Card title="Your API Key">
            <div className="p-3 bg-gray-100 rounded font-mono text-sm break-all shadow-inner">
              {verifier.api_key}
            </div>
            <button onClick={() => navigator.clipboard.writeText(verifier.api_key)} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Copy to Clipboard
            </button>
          </Card>

          <Card title="New KYC Request">
            <form onSubmit={handleFindUser} className="space-y-3 pb-4 border-b border-gray-200 dark:border-slate-700">
              <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Step 1: Find User by Email</label>
              <div className="flex space-x-2">
                <input
                  id="userEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700"
                />
                <button type="submit" className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Find</button>
              </div>
              {findUserStatus && <p className={`mt-1 text-sm ${findUserStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{findUserStatus}</p>}
            </form>
            
            <form onSubmit={handleRequestSubmit} className="space-y-4 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Step 2: Send Request</p>
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-500 dark:text-gray-400">User ID (auto-filled)</label>
                <input
                  id="userId"
                  type="text"
                  value={foundUserId}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-800 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="policy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Policy</label>
                <select id="policy" value={newRequestPolicy} onChange={(e) => setNewRequestPolicy(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                  <option value="isOver18">Is Over 18</option>
                </select>
              </div>
              <button type="submit" disabled={!foundUserId} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                Send Request
              </button>
              {requestStatus && <p className={`mt-2 text-sm font-medium ${requestStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{requestStatus}</p>}
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Request History">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Req ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Policy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Result/Proof</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  {requestHistory.length > 0 ? requestHistory.map(req => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{req.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{req.user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{req.policy_to_check}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        {req.etherscan_url ? (
                            <a href={req.etherscan_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Etherscan
                            </a>
                        ) : ( req.result || '--' )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No requests found. Create one to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;