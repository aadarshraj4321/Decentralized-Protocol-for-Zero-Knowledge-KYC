// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Page redirect ke liye
import axios from 'axios'; // API calls ke liye
import Card from '../components/Card';

const API_URL = 'http://localhost:8000'; // Hamare backend ka URL

function LoginPage() {
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault(); // Form ko default submit se rokein
    setError('');

    if (!companyName || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // Backend ke /verifiers/ endpoint par POST request bhejein
      const response = await axios.post(`${API_URL}/verifiers/`, {
        company_name: companyName,
        password: password, // Yeh password hum abhi ke liye bhej rahe hain
      });

      // Agar successful ho, toh response data (verifier ki details) ko
      // browser ke local storage mein save karein aur dashboard par redirect karein.
      localStorage.setItem('verifier', JSON.stringify(response.data));
      navigate('/'); // Root route (DashboardPage) par redirect karein

    } catch (err) {
      console.error('Registration failed:', err);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card title="Verifier Login / Register">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
              Register
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
export default LoginPage;