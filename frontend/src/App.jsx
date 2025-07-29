// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VerifierLoginPage from './pages/VerifierLoginPage'; // Renamed
import VerifierSignUpPage from './pages/VerifierSignUpPage'; // New
import DashboardPage from './pages/DashboardPage';
import UserWalletPage from './pages/UserWalletPage';
import UserLoginPage from './pages/UserLoginPage';
import UserSignUpPage from './pages/UserSignUpPage'; // New

function Navigation() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">ZK-KYC Engine</div>
        <div className="space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white">Verifier Dashboard</Link>
          <Link to="/wallet" className="text-gray-300 hover:text-white">User Wallet</Link>
          <hr className="border-gray-600 inline-block h-6 border-l mx-2" />
          <Link to="/login" className="text-gray-300 hover:text-white">Verifier Login</Link>
          <Link to="/user-login" className="text-gray-300 hover:text-white">User Login</Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <main>
        <Routes>
          <Route path="/login" element={<VerifierLoginPage />} />
          <Route path="/verifier-signup" element={<VerifierSignUpPage />} />
          <Route path="/user-login" element={<UserLoginPage />} />
          <Route path="/user-signup" element={<UserSignUpPage />} />
          <Route path="/wallet" element={<UserWalletPage />} />
          <Route path="/" element={<DashboardPage />} /> 
        </Routes>
      </main>
    </Router>
  );
}
export default App;