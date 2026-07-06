import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Helper function to get token from context or localStorage
export const getAuthToken = () => {
  try {
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Restore session from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setSession({
          user: parsed,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setSession((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setSession((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setSession({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setSession({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
