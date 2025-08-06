import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  login,
  register,
  logout,
  checkAuthStatus,
  testAuthConnection,
  switchProvider,
  clearError,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
  selectAuthProvider,
  selectConnectionStatus
} from '../store/slices/authSliceSupabase';

const AuthTest = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const authProvider = useSelector(selectAuthProvider);
  const connectionStatus = useSelector(selectConnectionStatus);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Test connection on component mount
    dispatch(testAuthConnection());
  }, [dispatch]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async () => {
    try {
      const result = await dispatch(register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName
      })).unwrap();
      
      addTestResult('Registration', 'success', `User registered: ${result.user?.email}`);
    } catch (error) {
      addTestResult('Registration', 'error', error);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap();
      
      addTestResult('Login', 'success', `User logged in: ${result.user?.email}`);
    } catch (error) {
      addTestResult('Login', 'error', error);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      addTestResult('Logout', 'success', 'User logged out successfully');
    } catch (error) {
      addTestResult('Logout', 'error', error);
    }
  };

  const handleCheckAuth = async () => {
    try {
      const result = await dispatch(checkAuthStatus()).unwrap();
      addTestResult('Check Auth', 'success', `Current user: ${result.user?.email}`);
    } catch (error) {
      addTestResult('Check Auth', 'error', error);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await dispatch(testAuthConnection()).unwrap();
      addTestResult('Test Connection', 'success', result.message);
    } catch (error) {
      addTestResult('Test Connection', 'error', error);
    }
  };

  const handleSwitchProvider = async (provider) => {
    try {
      await dispatch(switchProvider({ provider })).unwrap();
      addTestResult('Switch Provider', 'success', `Switched to ${provider}`);
    } catch (error) {
      addTestResult('Switch Provider', 'error', error);
    }
  };

  const addTestResult = (action, type, message) => {
    const result = {
      id: Date.now(),
      action,
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const clearResults = () => {
    setTestResults([]);
    dispatch(clearError());
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Supabase Authentication Test</h2>
      
      {/* Connection Status */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: connectionStatus?.success ? '#d4edda' : '#f8d7da',
        border: `1px solid ${connectionStatus?.success ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px'
      }}>
        <h4>Connection Status</h4>
        <p><strong>Provider:</strong> {authProvider || 'Unknown'}</p>
        <p><strong>Status:</strong> {connectionStatus?.success ? '✅ Connected' : '❌ Disconnected'}</p>
        <p><strong>Message:</strong> {connectionStatus?.message || 'No status available'}</p>
        {connectionStatus?.timestamp && (
          <p><strong>Last Check:</strong> {new Date(connectionStatus.timestamp).toLocaleString()}</p>
        )}
      </div>

      {/* Current User Status */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: isAuthenticated ? '#d1ecf1' : '#f8f9fa',
        border: '1px solid #bee5eb',
        borderRadius: '4px'
      }}>
        <h4>Current User</h4>
        {isAuthenticated ? (
          <div>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Display Name:</strong> {user?.displayName}</p>
            <p><strong>Auth Provider:</strong> {authProvider}</p>
          </div>
        ) : (
          <p>Not authenticated</p>
        )}
      </div>

      {/* Test Form */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h4>Test Authentication</h4>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            style={{ marginRight: '10px', padding: '5px', width: '200px' }}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            style={{ marginRight: '10px', padding: '5px', width: '200px' }}
          />
          <input
            type="text"
            name="displayName"
            placeholder="Display Name"
            value={formData.displayName}
            onChange={handleInputChange}
            style={{ padding: '5px', width: '200px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleRegister} disabled={isLoading} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Register
          </button>
          <button onClick={handleLogin} disabled={isLoading} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Login
          </button>
          <button onClick={handleLogout} disabled={isLoading} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Logout
          </button>
          <button onClick={handleCheckAuth} disabled={isLoading} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Check Auth
          </button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleTestConnection} disabled={isLoading} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Test Connection
          </button>
          <button onClick={() => handleSwitchProvider('supabase')} disabled={isLoading} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Use Supabase
          </button>
          <button onClick={() => handleSwitchProvider('firebase')} disabled={isLoading} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Use Firebase
          </button>
          <button onClick={clearResults} style={{ padding: '8px 15px' }}>
            Clear Results
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
          <p>⏳ Loading...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {/* Test Results */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Test Results</h4>
        {testResults.length === 0 ? (
          <p>No test results yet. Try the buttons above!</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {testResults.map(result => (
              <div
                key={result.id}
                style={{
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: result.type === 'success' ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${result.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                  borderRadius: '4px'
                }}
              >
                <strong>[{result.timestamp}] {result.action}:</strong> {result.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Info</summary>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify({
            isAuthenticated,
            authProvider,
            hasUser: !!user,
            hasToken: !!auth.token,
            connectionStatus,
            authConfig: auth.authConfig
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default AuthTest;
