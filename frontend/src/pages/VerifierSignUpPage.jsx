import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';

const API_URL = 'http://localhost:8000';

function VerifierSignUpPage() {
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_URL}/verifiers/`, { company_name: companyName, password });
      navigate('/login', { state: { message: "Account created successfully! Please sign in." } });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    }
  };

  return (
    <AuthLayout title="Create Verifier Account">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input id="companyName" label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button>Create Account</Button>
      </form>
      <div className="mt-6 text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">Already have an account? </span>
        <Link to="/login" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
export default VerifierSignUpPage;