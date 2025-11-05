import React, { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    // Only check token from localStorage, don't validate with API
    const token = localStorage.getItem('token');
    console.log('🔍 Checking token on mount:', token ? 'Present ✅' : 'Missing ❌');
    
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []); // Empty dependency - only run once

  const handleLogin = () => {
    console.log('🔐 Login success');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    console.log('🚪 Logout');
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('email');
    setIsLoggedIn(false);
  };

  if (isLoggedIn === null) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
