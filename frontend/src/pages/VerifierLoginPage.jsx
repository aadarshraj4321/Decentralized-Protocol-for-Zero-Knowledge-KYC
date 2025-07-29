import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';

const API_URL = 'http://localhost:8000';

function VerifierLoginPage() {
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    try {
      const loginForm = new FormData();
      loginForm.append('username', companyName);
      loginForm.append('password', password);
      
      // Step 1: Call the token endpoint to verify the password
      await axios.post(`${API_URL}/verifiers/token`, loginForm);

      // Step 2: If successful, fetch the full verifier object to get the API key
      const verifierDetailsResponse = await axios.get(`${API_URL}/verifiers/by-name/?name=${companyName}`);
      
      localStorage.setItem('verifier', JSON.stringify(verifierDetailsResponse.data));
      navigate('/'); // Redirect to dashboard

    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    }
  };

  return (
    <AuthLayout title="Verifier Sign In">
      {successMessage && <p className="text-sm text-center text-green-600 mb-4">{successMessage}</p>}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input id="companyName" label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button>Sign In</Button>
      </form>
      <div className="mt-6 text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">Need an account? </span>
        <Link to="/verifier-signup" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign Up
        </Link>
      </div>
    </AuthLayout>
  );
}
export default VerifierLoginPage;