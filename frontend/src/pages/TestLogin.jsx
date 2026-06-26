import React, { useState, useEffect } from 'react';

const TestLogin = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const testLogin = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@nafees.com',
          password: 'admin123'
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setResponse(data);
        // Try to save to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Saved to localStorage successfully');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Login Test Page</h1>
      
      <button 
        onClick={testLogin} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Login'}
      </button>

      {error && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px' }}>
          Error: {error}
        </div>
      )}

      {response && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px' }}>
          <h3>Success!</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
          <p>Token saved to localStorage: {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
          <p>User saved to localStorage: {localStorage.getItem('user') ? 'Yes' : 'No'}</p>
        </div>
      )}

      <hr style={{ marginTop: '30px' }} />
      
      <h2>Debug Info:</h2>
      <p>Frontend running at: {window.location.href}</p>
      <p>Backend URL: http://localhost:5001</p>
      <p>
        <button onClick={() => console.log('localStorage:', localStorage)}>
          Check localStorage in Console
        </button>
      </p>
    </div>
  );
};

export default TestLogin;
